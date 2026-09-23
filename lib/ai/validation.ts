import { isAllowedModelId } from "@/lib/ai/config";
import { CONTEXT_LIMITS } from "@/lib/ai/config";
import { isAutoModelId, isModelSelectionId } from "@/lib/ai/auto-model";
import { AI_MODELS } from "@/lib/ai/models";
import { isAiModeId } from "@/lib/ai/modes";
import { isAiToolId, type AiToolId } from "@/lib/ai/tools";
import type { AIMessage, ChatRequest } from "@/lib/ai/types";
import { parseChatImages } from "@/lib/ai/studio/images";

export type ValidationSuccess = { ok: true; data: ChatRequest };
export type ValidationFailure = { ok: false; status: 400; code: string; error: string };
export type ValidationResult = ValidationSuccess | ValidationFailure;

const ALLOWED_ROLES = new Set(["user", "assistant"]);

function fail(code: string, error: string): ValidationFailure {
  return { ok: false, status: 400, code, error };
}

function parseMessageList(raw: unknown): ValidationResult | AIMessage[] {
  if (!Array.isArray(raw)) {
    return fail("INVALID_MESSAGES", "Xabarlar ro'yxati noto'g'ri.");
  }
  if (raw.length === 0) {
    return fail("EMPTY_MESSAGES", "Xabar bo'sh bo'lmasligi kerak.");
  }
  if (raw.length > CONTEXT_LIMITS.maxMessagesInRequest) {
    return fail("TOO_MANY_MESSAGES", "So'rov haddan tashqari katta.");
  }

  const messages: AIMessage[] = [];
  let totalChars = 0;

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return fail("INVALID_MESSAGE", "Xabar tuzilishi noto'g'ri.");
    }
    const message = item as Record<string, unknown>;
    if (typeof message.role !== "string" || !ALLOWED_ROLES.has(message.role)) {
      return fail("INVALID_ROLE", "Xabar tuzilishi noto'g'ri.");
    }
    if (typeof message.content !== "string") {
      return fail("INVALID_CONTENT", "Xabar tuzilishi noto'g'ri.");
    }
    const content = message.content.trim();
    if (!content) {
      return fail("EMPTY_MESSAGES", "Xabar bo'sh bo'lmasligi kerak.");
    }
    if (content.length > CONTEXT_LIMITS.maxMessageChars) {
      return fail("MESSAGE_TOO_LONG", "So'rov haddan tashqari katta.");
    }
    totalChars += content.length;
    messages.push({
      role: message.role as "user" | "assistant",
      content,
    });
  }

  if (totalChars > CONTEXT_LIMITS.maxRequestChars) {
    return fail("REQUEST_TOO_LARGE", "So'rov haddan tashqari katta.");
  }

  if (messages[messages.length - 1]?.role !== "user") {
    return fail("LAST_NOT_USER", "Oxirgi xabar foydalanuvchidan bo'lishi kerak.");
  }

  return messages;
}

export function validateChatRequest(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") {
    return fail("INVALID_BODY", "So'rov noto'g'ri formatda.");
  }

  const body = input as Record<string, unknown>;

  if (typeof body.model !== "string" || !isModelSelectionId(body.model)) {
    return fail("INVALID_MODEL", "Tanlangan model ruxsat etilmagan.");
  }
  if (!isAutoModelId(body.model) && !isAllowedModelId(body.model)) {
    return fail("INVALID_MODEL", "Tanlangan model ruxsat etilmagan.");
  }

  const conversationId =
    typeof body.conversationId === "string" && body.conversationId.trim()
      ? body.conversationId.trim()
      : undefined;
  const regenerate = body.regenerate === true;
  const retry = body.retry === true;
  const editMessageId =
    typeof body.editMessageId === "string" && body.editMessageId.trim()
      ? body.editMessageId.trim()
      : undefined;
  const mode = typeof body.mode === "string" && isAiModeId(body.mode) ? body.mode : undefined;
  const content = typeof body.content === "string" ? body.content.trim() : "";
  let tool: AiToolId | undefined;
  if (body.tool !== undefined) {
    if (typeof body.tool !== "string" || !isAiToolId(body.tool)) {
      return fail("INVALID_TOOL", "Noto'g'ri vosita tanlandi.");
    }
    tool = body.tool;
  }

  const webSearch = body.webSearch === true;
  const memoryEnabled = body.memoryEnabled === true;
  const personaId = typeof body.personaId === "string" ? body.personaId.slice(0, 40) : undefined;
  const responseStyle = typeof body.responseStyle === "string" ? body.responseStyle.slice(0, 40) : undefined;
  const parsedImages = parseChatImages(body.images);
  if (!parsedImages.ok) return fail(parsedImages.code, parsedImages.error);
  const images = parsedImages.images.length ? parsedImages.images : undefined;

  if (content || regenerate || retry || editMessageId) {
    if (!conversationId) {
      return fail("MISSING_CONVERSATION", "Suhbat topilmadi.");
    }
    if (editMessageId && !content) {
      return fail("EMPTY_MESSAGES", "Xabar bo'sh bo'lmasligi kerak.");
    }
    if (!regenerate && !retry && !editMessageId && !content && !images?.length) {
      return fail("EMPTY_MESSAGES", "Xabar bo'sh bo'lmasligi kerak.");
    }
    if (content.length > CONTEXT_LIMITS.maxMessageChars) {
      return fail("MESSAGE_TOO_LONG", "So'rov haddan tashqari katta.");
    }
    const userContent = content || (images?.length ? "Rasmni tahlil qiling." : "");
    return {
      ok: true,
      data: {
        conversationId,
        model: isModelSelectionId(body.model) ? body.model : "nodir-balanced",
        messages: userContent ? [{ role: "user", content: userContent }] : [],
        content: userContent || undefined,
        regenerate,
        retry,
        editMessageId,
        mode,
        tool,
        webSearch,
        memoryEnabled,
        personaId,
        responseStyle,
        images,
      },
    };
  }

  const parsed = parseMessageList(body.messages);
  if (!Array.isArray(parsed)) return parsed;

  return {
    ok: true,
    data: {
      conversationId,
      messages: parsed,
      model: isModelSelectionId(body.model) ? body.model : "nodir-balanced",
      regenerate,
      retry,
      editMessageId,
      mode,
      tool,
      webSearch,
      memoryEnabled,
      personaId,
      responseStyle,
      images,
    },
  };
}

export function isKnownModel(id: string) {
  return AI_MODELS.some((model) => model.id === id);
}
