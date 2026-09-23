import { AI_MODELS, DEFAULT_MODEL_ID, modelSupportsVision, type AiModelId } from "@/lib/ai/models";
import type { AiModeId } from "@/lib/ai/modes";
import { getPlan, type PlanId } from "@/lib/billing/plans";

export const AUTO_MODEL_ID = "auto" as const;
export type ModelSelectionId = AiModelId | typeof AUTO_MODEL_ID;

const CODING_RE =
  /```|function\s|class\s|const\s|let\s|import\s|from\s['"]|def\s|fn\s|error|bug|stack trace|typescript|javascript|python|sql|flutter|react|next\.js|\.tsx|\.py|\.rs/i;
const REASONING_RE =
  /\b(nima uchun|why|qanday ishlaydi|prove|step by step|qadam[- ]baqadam|mulohaza|tahlil|compare|farqi|reasoning|explain in depth)\b/i;

export function isAutoModelId(value: string): value is typeof AUTO_MODEL_ID {
  return value === AUTO_MODEL_ID;
}

export function isModelSelectionId(value: string): value is ModelSelectionId {
  return isAutoModelId(value) || AI_MODELS.some((model) => model.id === value);
}

export function allowedModelsForPlan(plan: PlanId): AiModelId[] {
  const allowed = getPlan(plan).allowedModels.filter((id) =>
    AI_MODELS.some((model) => model.id === id),
  );
  return allowed.length ? allowed : [DEFAULT_MODEL_ID];
}

function firstAllowed(preferred: AiModelId[], allowed: AiModelId[]): AiModelId {
  for (const id of preferred) {
    if (allowed.includes(id)) return id;
  }
  return allowed[0] ?? DEFAULT_MODEL_ID;
}

/**
 * Server-side Auto picker. Only returns ids from AI_MODELS that the plan allows.
 * Heuristics: simple→fast, coding→balanced/advanced, long doc→advanced, reasoning→advanced.
 */
export function pickAutoModel(input: {
  text: string;
  mode?: AiModeId | string;
  plan: PlanId;
}): AiModelId {
  const allowed = allowedModelsForPlan(input.plan);
  const text = input.text.trim();
  const mode = input.mode;
  const longDoc = text.length > 2500;
  const coding = mode === "coding" || CODING_RE.test(text);
  const reasoning =
    mode === "research" || mode === "study" || REASONING_RE.test(text);
  const simple =
    text.length > 0 &&
    text.length < 80 &&
    !coding &&
    !reasoning &&
    (mode === "general" || !mode);

  if (longDoc) {
    return firstAllowed(["nodir-advanced", "nodir-balanced", "nodir-fast"], allowed);
  }
  if (coding) {
    return firstAllowed(["nodir-balanced", "nodir-advanced", "nodir-fast"], allowed);
  }
  if (reasoning) {
    return firstAllowed(["nodir-advanced", "nodir-balanced", "nodir-fast"], allowed);
  }
  if (simple) {
    return firstAllowed(["nodir-fast", "nodir-balanced", "nodir-advanced"], allowed);
  }
  return firstAllowed(["nodir-balanced", "nodir-fast", "nodir-advanced"], allowed);
}

export function resolveSelectedModel(
  selection: string,
  input: { text: string; mode?: string; plan: PlanId; hasImages?: boolean },
): { model: AiModelId; auto: boolean } {
  const picked = (() => {
    if (isAutoModelId(selection) || selection === "") {
      return { model: pickAutoModel(input), auto: true };
    }
    const known = AI_MODELS.find((model) => model.id === selection);
    if (!known) {
      return { model: pickAutoModel(input), auto: true };
    }
    const allowed = allowedModelsForPlan(input.plan);
    if (!allowed.includes(known.id)) {
      return { model: firstAllowed([known.id, DEFAULT_MODEL_ID], allowed), auto: false };
    }
    return { model: known.id, auto: false };
  })();

  if (!input.hasImages) return picked;

  if (modelSupportsVision(picked.model)) return picked;
  const visionAllowed = allowedModelsForPlan(input.plan).filter(modelSupportsVision);
  if (!visionAllowed.length) return picked;
  return { model: firstAllowed(["nodir-balanced", "nodir-advanced"], visionAllowed), auto: true };
}
