import type { ModelCapability } from "@/lib/ai/capabilities-types";
import type { PlanId } from "@/lib/db/types";

/**
 * UI catalog. Provider model IDs are resolved in lib/ai/config.ts
 * so Fast / Balanced / Advanced can share one OPENAI_MODEL until overrides are set.
 */
export const AI_MODELS = [
  {
    id: "nodir-fast",
    name: "Fast",
    displayName: "Fast",
    productName: "Nodir AI",
    description: "Tez javoblar, kundalik vazifalar uchun.",
    provider: "openai" as const,
    contextLength: 128_000,
    supportsVision: true,
    supportsTools: true,
    supportsStreaming: true,
    minPlan: "free" as PlanId,
    capabilities: {
      text: true,
      vision: true,
      longContext: false,
      coding: true,
      toolUse: true,
      imageGeneration: false,
    } satisfies ModelCapability,
  },
  {
    id: "nodir-balanced",
    name: "Balanced",
    displayName: "Balanced",
    productName: "Nodir AI",
    description: "Sifat va tezlik o'rtasidagi muvozanat.",
    provider: "openai" as const,
    contextLength: 128_000,
    supportsVision: true,
    supportsTools: true,
    supportsStreaming: true,
    minPlan: "pro" as PlanId,
    capabilities: {
      text: true,
      vision: true,
      longContext: true,
      coding: true,
      toolUse: true,
      imageGeneration: false,
    } satisfies ModelCapability,
  },
  {
    id: "nodir-advanced",
    name: "Advanced",
    displayName: "Advanced",
    productName: "Nodir AI",
    description: "Murakkab tahlil va chuqur mulohaza.",
    provider: "openai" as const,
    contextLength: 200_000,
    supportsVision: true,
    supportsTools: true,
    supportsStreaming: true,
    minPlan: "pro_plus" as PlanId,
    capabilities: {
      text: true,
      vision: true,
      longContext: true,
      coding: true,
      toolUse: true,
      imageGeneration: false,
    } satisfies ModelCapability,
  },
] as const;

export type AiModelId = (typeof AI_MODELS)[number]["id"];

export const DEFAULT_MODEL_ID: AiModelId = "nodir-balanced";

export function isAiModelId(value: string): value is AiModelId {
  return AI_MODELS.some((model) => model.id === value);
}

export function getModelById(id: string) {
  return AI_MODELS.find((model) => model.id === id) ?? AI_MODELS[1];
}

export function getModelCapabilities(id: AiModelId): ModelCapability {
  return getModelById(id).capabilities;
}

export function modelSupportsVision(id: AiModelId) {
  return getModelById(id).supportsVision;
}

/** Prefer the requested model when it is in the plan allow-list; otherwise first allowed. */
export function selectConfiguredModel(requested: string | undefined, allowed: readonly AiModelId[]): AiModelId {
  if (requested && isAiModelId(requested) && allowed.includes(requested)) return requested;
  return allowed[0] ?? DEFAULT_MODEL_ID;
}
