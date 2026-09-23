import { isOpenAiConfigured, resolveProviderModel } from "@/lib/ai/config";
import { completeAiText, requestTimeoutSignal, streamAiResponse } from "@/lib/ai/complete";
import { USER_ERRORS } from "@/lib/ai/errors";
import { DEFAULT_MODEL_ID, type AiModelId } from "@/lib/ai/models";
import { isAllowedModelId } from "@/lib/ai/config";
import { CONTEXT_LIMITS } from "@/lib/ai/config";
import { isAiToolId, systemPromptForTool, type AiToolId } from "@/lib/ai/tools";
import { requireUser } from "@/lib/db/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { assertUsage, recordUsage, usageLimitJson } from "@/lib/usage/track";
import type { UsageTool } from "@/lib/usage/config";
import { getRequestIdentity } from "@/lib/auth/request-user";
import { limitRoute } from "@/lib/security/rate-limit";
import { assertFeature, assertModelAccess, entitlementJson } from "@/lib/billing/entitlements";
import { contextLimitsFor } from "@/lib/billing/plans";

export const runtime = "nodejs";
export const maxDuration = 60;

const STREAM_TOOLS: AiToolId[] = ["translate", "writer", "code", "summarizer", "chat"];

function jsonError(message: string, code: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ error: message, code, ...extra }, { status });
}

export async function POST(request: Request) {
  const gated = limitRoute(request, "chat");
  if (!gated.ok) return jsonError("So'rovlar juda ko'p.", "RATE_LIMIT", 429);
  const identity = await getRequestIdentity(request);
  if (!identity) {
    return jsonError("Davom etish uchun tizimga kiring.", "UNAUTHORIZED", 401);
  }
  const planLimit = limitRoute(request, "chat", identity.plan);
  if (!planLimit.ok) return jsonError("So'rovlar juda ko'p.", "RATE_LIMIT", 429);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("So'rov noto'g'ri formatda.", "INVALID_JSON", 400);
  }

  if (typeof body.tool !== "string" || !isAiToolId(body.tool) || body.tool === "image" || body.tool === "documents") {
    return jsonError("Noto'g'ri vosita tanlandi.", "INVALID_TOOL", 400);
  }

  const tool = body.tool;
  const featureMap = {
    chat: "chat",
    translate: "translate",
    writer: "writer",
    code: "code",
    summarizer: "summarizer",
  } as const;
  const feature = featureMap[tool as keyof typeof featureMap];
  if (feature) {
    const gate = await assertFeature(identity, feature);
    if (!gate.ok) return entitlementJson(gate);
  }
  const usageTool = tool as UsageTool;
  const { supabase } = isSupabaseConfigured() ? await requireUser() : { supabase: null };
  const usage = await assertUsage(request, usageTool, supabase);
  if (!usage.ok) {
    if (usage.code === "USAGE_LIMIT" && "limit" in usage) return usageLimitJson(usage);
    return jsonError(usage.error, usage.code, usage.status, {
      title: "title" in usage ? usage.title : undefined,
      cta: "cta" in usage ? usage.cta : undefined,
    });
  }

  if (!isOpenAiConfigured()) {
    return jsonError(USER_ERRORS.missingKey, "MISSING_API_KEY", 503);
  }

  const modelId = typeof body.model === "string" && isAllowedModelId(body.model) ? body.model : DEFAULT_MODEL_ID;
  const modelGate = await assertModelAccess(identity, modelId as AiModelId);
  if (!modelGate.ok) return entitlementJson(modelGate);
  const input = typeof body.input === "string" ? body.input.trim() : "";
  if (!input || input.length > CONTEXT_LIMITS.maxRequestChars) {
    return jsonError(input ? "So'rov haddan tashqari katta." : "Matn bo'sh bo'lmasligi kerak.", "INVALID_INPUT", 400);
  }

  const extra = buildToolUserMessage(tool, body, input);
  await recordUsage(request, usageTool, supabase);
  const history = [{ role: "user" as const, content: extra.prompt }];
  const signal = requestTimeoutSignal(request);
  const providerModel = resolveProviderModel(modelId as AiModelId);
  const addon = systemPromptForTool(tool);

  if (STREAM_TOOLS.includes(tool) && body.stream !== false) {
    return streamAiResponse(history, providerModel, addon, signal, {
      contextLimits: contextLimitsFor(identity.plan),
    });
  }

  const completed = await completeAiText(history, addon, modelId, signal, contextLimitsFor(identity.plan));
  if (!completed.ok) return jsonError(completed.error, completed.code, completed.status);
  return Response.json({ text: completed.text, tool });
}

function buildToolUserMessage(tool: AiToolId, body: Record<string, unknown>, input: string) {
  if (tool === "translate") {
    const source = typeof body.sourceLanguage === "string" ? body.sourceLanguage : "auto";
    const target = typeof body.targetLanguage === "string" ? body.targetLanguage : "uzbek";
    return {
      ok: true as const,
      prompt: `Translate the following text.\nSource language: ${source}\nTarget language: ${target}\n\n${input}`,
    };
  }
  if (tool === "writer") {
    const kind = typeof body.kind === "string" ? body.kind : "article";
    const tone = typeof body.tone === "string" ? body.tone : "professional";
    const length = typeof body.length === "string" ? body.length : "medium";
    const action = typeof body.action === "string" ? body.action : "write";
    return {
      ok: true as const,
      prompt: `Writing task: ${action}. Format: ${kind}. Tone: ${tone}. Length: ${length}. Topic/text:\n${input}`,
    };
  }
  if (tool === "code") {
    const language = typeof body.language === "string" ? body.language : "TypeScript";
    const action = typeof body.action === "string" ? body.action : "generate";
    return {
      ok: true as const,
      prompt: `Coding task: ${action}. Language: ${language}.\nDo not execute code. Request:\n${input}`,
    };
  }
  if (tool === "summarizer") {
    const length = typeof body.length === "string" ? body.length : "medium";
    return {
      ok: true as const,
      prompt: `Summarize the following text. Length: ${length}.\n\n${input}`,
    };
  }
  return { ok: true as const, prompt: input };
}
