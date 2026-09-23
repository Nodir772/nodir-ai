import type { AiModelId } from "@/lib/ai/models";
import type { AiToolId } from "@/lib/ai/tools";
import { getPlan, type BillingFeature, type PlanId } from "@/lib/billing/plans";

export function canUseFeature(plan: PlanId, feature: BillingFeature) {
  return getPlan(plan).features[feature] === true;
}

export function canUseModel(plan: PlanId, model: AiModelId) {
  return getPlan(plan).allowedModels.includes(model);
}

export function canUseTool(plan: PlanId, tool: AiToolId) {
  return getPlan(plan).allowedTools.includes(tool);
}

export function remainingUsage(used: number, limit: number) {
  if (limit === 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, limit - used);
}

export function isUsageExceeded(used: number, limit: number) {
  if (limit === 0) return false;
  return used >= limit;
}
