import OpenAI from "openai";
import { CONTEXT_LIMITS, resolveProviderModel } from "@/lib/ai/config";
import { mergeSignals, streamAiResponse } from "@/lib/ai/complete";
import { mapProviderError, USER_ERRORS } from "@/lib/ai/errors";
import { resolveSelectedModel } from "@/lib/ai/auto-model";
import { getModelById } from "@/lib/ai/models";
import { prepareChatContext } from "@/lib/ai/prepare-chat";
import { assertFeature, assertModelAccess, entitlementJson } from "@/lib/billing/entitlements";
import { limitRoute } from "@/lib/ai/rate-limit";
import type { AIMessage } from "@/lib/ai/types";
import { validateChatRequest } from "@/lib/ai/validation";
import { getRequestIdentity } from "@/lib/auth/request-user";
import { LOCAL_SESSION_COOKIE } from "@/lib/auth/constants";
import { generateTitle, isMeaningfulMessage } from "@/lib/chat/title";
import { requireUser } from "@/lib/db/auth";
import { getConversation, updateConversationTitle } from "@/lib/db/conversations";
import { DB_ERRORS } from "@/lib/db/errors";
import {
  deleteLastAssistantMessage,
  deleteMessagesAfter,
  getMessages,
  saveMessage,
  updateMessageContent,
} from "@/lib/db/messages";
import { ensureProfile } from "@/lib/db/profiles";
import { getSettings } from "@/lib/db/settings";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { assertUsage, recordUsage, usageLimitJson } from "@/lib/usage/track";
import { contextLimitsFor, type PlanId } from "@/lib/billing/plans";
import { modelSupportsVision, VISION_UNSUPPORTED } from "@/lib/ai/capabilities";
import { decodeChatImage } from "@/lib/ai/studio/images";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonError(message: string, code: string, status: number, extra?: Record<string, string>) {
  return Response.json({ error: message, code, ...extra }, { status });
}

async function isLocalAuthenticated(request: Request) {
  return Boolean(request.headers.get("cookie")?.includes(`${LOCAL_SESSION_COOKIE}=`));
}

function resolveVision(images: { mime: string; data: string }[] | undefined) {
  if (!images?.length) return { ok: true as const, parts: [] as { mime: string; data: string }[] };
  const parts: { mime: string; data: string }[] = [];
  for (const image of images) {
    const decoded = decodeChatImage(image);
    if (!decoded.ok) return { ok: false as const, error: decoded.error, code: decoded.code };
    parts.push({ mime: decoded.mime, data: image.data });
  }
  return { ok: true as const, parts };
}

function lastUserText(validated: { content?: string; messages: AIMessage[] }) {
  if (validated.content?.trim()) return validated.content.trim();
  return [...validated.messages].reverse().find((message) => message.role === "user")?.content ?? "";
}

export async function POST(request: Request) {
  const identityEarly = await getRequestIdentity(request);
  const limited = limitRoute(request, "chat", identityEarly?.plan);
  if (!limited.ok) {
    return jsonError(USER_ERRORS.rateLimit, "RATE_LIMIT", 429);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("So'rov noto'g'ri formatda.", "INVALID_JSON", 400);
  }

  const validated = validateChatRequest(payload);
  if (!validated.ok) {
    return jsonError(validated.error, validated.code, validated.status);
  }

  const skipUsage =
    validated.data.regenerate === true ||
    validated.data.retry === true ||
    Boolean(validated.data.editMessageId);

  if (!skipUsage) {
    const usage = await assertUsage(request, validated.data.tool === "image" ? "image" : "chat");
    if (!usage.ok) {
      if (usage.code === "USAGE_LIMIT" && "limit" in usage) return usageLimitJson(usage);
      return jsonError(usage.error, usage.code, usage.status);
    }
  }

  const identity = identityEarly;
  const plan: PlanId = identity?.plan ?? "free";
  const resolved = resolveSelectedModel(validated.data.model, {
    text: lastUserText(validated.data),
    mode: validated.data.mode,
    plan,
    hasImages: Boolean(validated.data.images?.length),
  });

  if (validated.data.images?.length && !modelSupportsVision(resolved.model)) {
    return jsonError(VISION_UNSUPPORTED, "VISION_UNSUPPORTED", 400);
  }
  if (identity) {
    const modelGate = await assertModelAccess(identity, resolved.model);
    if (!modelGate.ok) return entitlementJson(modelGate);
    if (validated.data.webSearch) {
      const searchGate = await assertFeature(identity, "web_search");
      if (!searchGate.ok) return entitlementJson(searchGate);
      if (!skipUsage) {
        const searchUsage = await assertUsage(request, "search");
        if (!searchUsage.ok) {
          if (searchUsage.code === "USAGE_LIMIT" && "limit" in searchUsage) return usageLimitJson(searchUsage);
          return jsonError(searchUsage.error, searchUsage.code, searchUsage.status);
        }
      }
    }
  }

  const timeout = AbortSignal.timeout(CONTEXT_LIMITS.openaiTimeoutMs);
  const signal = mergeSignals(request.signal, timeout);
  const providerModel = resolveProviderModel(resolved.model);
  const catalog = getModelById(resolved.model);
  const usedModel = { id: resolved.model, name: catalog.name, auto: resolved.auto };
  const vision = resolveVision(validated.data.images);
  if (!vision.ok) return jsonError(vision.error, vision.code, 400);

  if (!isSupabaseConfigured()) {
    if (!(await isLocalAuthenticated(request))) {
      return jsonError(USER_ERRORS.unauthorized, "UNAUTHORIZED", 401);
    }
    if (!skipUsage) {
      await recordUsage(request, "chat");
      if (validated.data.webSearch) await recordUsage(request, "search");
    }
    const prepared = await prepareChatContext({
      history: validated.data.messages,
      tool: validated.data.tool,
      webSearch: validated.data.webSearch === true,
      personaId: validated.data.personaId,
      responseStyle: validated.data.responseStyle,
      memoryEnabled: validated.data.memoryEnabled === true,
      userId: identity?.id,
      supabase: null,
      mode: validated.data.mode,
    });
    return streamAiResponse(validated.data.messages, providerModel, prepared.extraSystem, signal, {
      ...prepared.meta,
      usedModel,
      visionImages: vision.parts,
      contextLimits: contextLimitsFor(identity?.plan),
    });
  }

  const { user, supabase } = await requireUser();
  if (!user || !supabase) {
    return jsonError(USER_ERRORS.unauthorized, "UNAUTHORIZED", 401);
  }

  const conversationId = validated.data.conversationId;
  if (!conversationId) {
    return jsonError(DB_ERRORS.notFound, "MISSING_CONVERSATION", 400);
  }

  try {
    await ensureProfile(supabase, user);
    const owned = await getConversation(supabase, user.id, conversationId);
    if (owned.forbidden) {
      return jsonError(DB_ERRORS.forbidden, "FORBIDDEN", 403);
    }
    if (!owned.conversation) {
      return jsonError(DB_ERRORS.notFound, "NOT_FOUND", 404);
    }

    if (validated.data.editMessageId && validated.data.content) {
      const updated = await updateMessageContent(
        supabase,
        user.id,
        conversationId,
        validated.data.editMessageId,
        validated.data.content,
      );
      if (updated.forbidden) return jsonError(DB_ERRORS.forbidden, "FORBIDDEN", 403);
      if (updated.missing || !updated.message) {
        return jsonError(DB_ERRORS.notFound, "NOT_FOUND", 404);
      }
      await deleteMessagesAfter(supabase, user.id, conversationId, validated.data.editMessageId);
      if (owned.conversation.title === "Yangi suhbat" && isMeaningfulMessage(validated.data.content)) {
        await updateConversationTitle(
          supabase,
          user.id,
          conversationId,
          generateTitle(validated.data.content),
        );
      }
    } else if (validated.data.regenerate || validated.data.retry) {
      await deleteLastAssistantMessage(supabase, user.id, conversationId);
    } else if (validated.data.content) {
      const saved = await saveMessage(supabase, user.id, {
        conversationId,
        role: "user",
        content: validated.data.content,
      });
      if (saved.forbidden) return jsonError(DB_ERRORS.forbidden, "FORBIDDEN", 403);
      if (owned.conversation.title === "Yangi suhbat" && isMeaningfulMessage(validated.data.content)) {
        await updateConversationTitle(
          supabase,
          user.id,
          conversationId,
          generateTitle(validated.data.content),
        );
      }
    }

    const loaded = await getMessages(supabase, user.id, conversationId);
    if (loaded.forbidden) return jsonError(DB_ERRORS.forbidden, "FORBIDDEN", 403);

    const history: AIMessage[] = loaded.messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({ role: message.role, content: message.content }));

    const settings = await getSettings(supabase, user.id);
    const prepared = await prepareChatContext({
      history,
      tool: validated.data.tool,
      webSearch: validated.data.webSearch === true,
      personaId: settings?.personaId ?? validated.data.personaId,
      responseStyle: settings?.responseStyle ?? validated.data.responseStyle,
      memoryEnabled: Boolean(settings?.memoryEnabled),
      userId: user.id,
      supabase,
      mode: validated.data.mode,
      projectId: owned.conversation.projectId,
    });

    if (!skipUsage) {
      await recordUsage(request, "chat", supabase);
      if (validated.data.webSearch) await recordUsage(request, "search", supabase);
    }

    return streamAiResponse(history, providerModel, prepared.extraSystem, signal, {
      ...prepared.meta,
      usedModel,
      visionImages: vision.parts,
      contextLimits: contextLimitsFor(identity?.plan),
      onComplete: async (produced) => {
        await saveMessage(supabase, user.id, {
          conversationId,
          role: "assistant",
          content: produced,
        });
      },
    });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      const mapped = mapProviderError(error);
      return jsonError(mapped.message, mapped.code, mapped.status);
    }
    return jsonError(DB_ERRORS.unavailable, "DATABASE_ERROR", 500);
  }
}
