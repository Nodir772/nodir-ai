import "server-only";

import { getOpenAIClient } from "@/lib/ai/client";
import { CONTEXT_LIMITS, resolveProviderModel } from "@/lib/ai/config";
import { buildModelContext } from "@/lib/ai/context";
import { mapProviderError } from "@/lib/ai/errors";
import { isOpenAiApiKeyPlausible } from "@/lib/ai/env";
import { buildLocalAssistantReply, chunkLocalReply } from "@/lib/ai/local-fallback";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { encodeSse } from "@/lib/ai/streaming";
import { STREAM_HEADERS } from "@/lib/security/headers";
import { observeResponse } from "@/lib/observability/monitor";
import type { AIMessage, StreamEvent } from "@/lib/ai/types";
import { DEFAULT_MODEL_ID, type AiModelId } from "@/lib/ai/models";
import { isAllowedModelId } from "@/lib/ai/config";

const OPENAI_BILLING_RETRY_MS = 5 * 60 * 1000;
let openaiBillingExhaustedAt = 0;

export type StreamMeta = {
  memories?: { id: string; content: string }[];
  sources?: { title: string; url: string; snippet: string; domain?: string }[];
  search?: { configured: boolean; error?: string };
  contextLimits?: { maxMessages: number; maxRequestChars: number };
  usedModel?: { id: AiModelId; name: string; auto: boolean };
  visionImages?: { mime: string; data: string }[];
  onComplete?: (text: string) => Promise<void>;
};

function openaiBillingBlocked() {
  return openaiBillingExhaustedAt > 0 && Date.now() - openaiBillingExhaustedAt < OPENAI_BILLING_RETRY_MS;
}

function markOpenAiBillingExhausted() {
  openaiBillingExhaustedAt = Date.now();
}

async function emitLocalReply(
  send: (event: StreamEvent) => void,
  history: AIMessage[],
  meta?: StreamMeta,
) {
  const produced = buildLocalAssistantReply(history, meta?.sources);
  for (const part of chunkLocalReply(produced)) {
    send({ type: "delta", text: part });
  }
  if (meta?.onComplete) await meta.onComplete(produced);
  send({ type: "done" });
}

export function mergeSignals(first: AbortSignal, second: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (first.aborted || second.aborted) {
    controller.abort();
    return controller.signal;
  }
  first.addEventListener("abort", abort, { once: true });
  second.addEventListener("abort", abort, { once: true });
  return controller.signal;
}

export function streamAiResponse(
  history: AIMessage[],
  model: string,
  extraSystem: string | undefined,
  signal: AbortSignal,
  meta?: StreamMeta,
) {
  const client = getOpenAIClient();
  const context = buildModelContext(history, extraSystem, meta?.contextLimits);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(encodeSse(event)));
      };
      if (meta?.memories?.length) send({ type: "memory", items: meta.memories });
      if (meta?.sources?.length) send({ type: "sources", results: meta.sources });
      if (meta?.search) send({ type: "search", configured: meta.search.configured, error: meta.search.error });
      if (meta?.usedModel) send({ type: "model", ...meta.usedModel });
      try {
        const skipProvider =
          !client ||
          !isOpenAiApiKeyPlausible() ||
          openaiBillingBlocked() ||
          !isSupabaseConfigured();
        if (!skipProvider && client) {
          const openaiMessages = context.messages.map((message, index) => {
            const isLastUser =
              message.role === "user" && index === context.messages.length - 1 && (meta?.visionImages?.length ?? 0) > 0;
            if (!isLastUser || !meta?.visionImages?.length) {
              return { role: message.role, content: message.content };
            }
            return {
              role: "user" as const,
              content: [
                { type: "text" as const, text: message.content },
                ...meta.visionImages.map((image) => ({
                  type: "image_url" as const,
                  image_url: { url: `data:${image.mime};base64,${image.data}` },
                })),
              ],
            };
          });
          const completion = await client.chat.completions.create(
            { model, messages: openaiMessages as never, stream: true },
            { signal },
          );
          let produced = "";
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              produced += text;
              send({ type: "delta", text });
            }
          }
          if (!produced.trim()) {
            await emitLocalReply(send, history, meta);
          } else {
            if (meta?.onComplete) await meta.onComplete(produced);
            send({ type: "done" });
          }
          return;
        }
        await emitLocalReply(send, history, meta);
      } catch (error) {
        const mapped = mapProviderError(error);
        if (mapped.code === "CANCELLED") return;
        if (mapped.code === "QUOTA") {
          markOpenAiBillingExhausted();
          await emitLocalReply(send, history, meta);
          return;
        }
        send({
          type: "error",
          code: mapped.code,
          message: mapped.message,
          category: mapped.category,
          providerStatus: mapped.providerStatus,
          providerCode: mapped.providerCode,
          providerType: mapped.providerType,
        });
      } finally {
        controller.close();
      }
    },
  });

  const started = Date.now();
  return observeResponse(
    "/api/chat",
    started,
    new Response(stream, {
      headers: STREAM_HEADERS,
    }),
    { method: "POST", status: 200 },
  );
}

export async function completeAiText(
  history: AIMessage[],
  extraSystem: string | undefined,
  modelId: string | undefined,
  signal: AbortSignal,
  contextLimits?: { maxMessages: number; maxRequestChars: number },
) {
  const localText = () => buildLocalAssistantReply(history);
  const client = getOpenAIClient();
  if (!client || !isOpenAiApiKeyPlausible() || openaiBillingBlocked() || !isSupabaseConfigured()) {
    return { ok: true as const, text: localText() };
  }
  const model = resolveProviderModel(isAllowedModelId(modelId ?? "") ? (modelId as AiModelId) : DEFAULT_MODEL_ID);
  const context = buildModelContext(history, extraSystem, contextLimits);
  try {
    const completion = await client.chat.completions.create(
      { model, messages: context.messages, stream: false },
      { signal },
    );
    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return { ok: true as const, text: localText() };
    }
    return { ok: true as const, text };
  } catch (error) {
    const mapped = mapProviderError(error);
    if (mapped.code === "QUOTA") {
      markOpenAiBillingExhausted();
      return { ok: true as const, text: localText() };
    }
    return { ok: false as const, status: mapped.status, error: mapped.message, code: mapped.code };
  }
}

export function requestTimeoutSignal(request: Request) {
  return mergeSignals(request.signal, AbortSignal.timeout(CONTEXT_LIMITS.openaiTimeoutMs));
}
