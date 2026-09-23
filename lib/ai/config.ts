import { AI_MODELS, type AiModelId } from "@/lib/ai/models";
import { isOpenAiApiKeyPlausible } from "@/lib/ai/env";

export type ModelConfig = {
  id: AiModelId;
  name: string;
  productName: string;
  description: string;
  provider: "openai";
};

export const CONTEXT_LIMITS = {
  maxMessages: 24,
  maxMessageChars: 12_000,
  maxRequestChars: 48_000,
  maxMessagesInRequest: 40,
  openaiTimeoutMs: 60_000,
} as const;

export const RATE_LIMIT = {
  limit: 20,
  windowMs: 60_000,
} as const;

export function isOpenAiConfigured() {
  return isOpenAiApiKeyPlausible();
}

/**
 * UI model IDs are validated, then mapped here.
 * If only OPENAI_MODEL is set, Fast/Balanced/Advanced share that one model.
 */
export function resolveProviderModel(id: AiModelId): string {
  const fallback = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const overrides: Record<AiModelId, string | undefined> = {
    "nodir-fast": process.env.OPENAI_MODEL_FAST?.trim(),
    "nodir-balanced": process.env.OPENAI_MODEL_BALANCED?.trim(),
    "nodir-advanced": process.env.OPENAI_MODEL_ADVANCED?.trim(),
  };
  return overrides[id] || fallback;
}

export function isAllowedModelId(value: string): value is AiModelId {
  return AI_MODELS.some((model) => model.id === value);
}

export function modelsShareProviderId() {
  const ids = AI_MODELS.map((model) => resolveProviderModel(model.id));
  return ids.every((id) => id === ids[0]);
}
