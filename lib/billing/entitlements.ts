import "server-only";

import type { AiModelId } from "@/lib/ai/models";
import {
  getPlan,
  requiredPlanForFeature,
  requiredPlanForModel,
  type BillingFeature,
  type PlanId,
} from "@/lib/billing/plans";
import { canUseFeature, canUseModel, canUseTool, remainingUsage } from "@/lib/billing/access";
import { isFlagEnabled } from "@/lib/billing/flags";
import type { RequestIdentity } from "@/lib/auth/request-user";

export { canUseFeature, canUseModel, canUseTool, remainingUsage as remaining };

export type EntitlementDenial = {
  ok: false;
  status: 402 | 403 | 429;
  code: "PLAN_REQUIRED" | "FEATURE_DISABLED" | "ACCOUNT_SUSPENDED" | "USAGE_LIMIT";
  error: string;
  title: string;
  cta: string;
  feature?: BillingFeature | "model";
  currentPlan: PlanId;
  requiredPlan?: PlanId;
};

export type EntitlementOk = { ok: true; plan: PlanId };

const COPY = {
  upgradeTitle: "Tarifni yangilash kerak",
  upgradeCta: "Tariflarni ko'rish",
  disabledTitle: "Funksiya o'chirilgan",
  suspended: "Hisob vaqtincha to'xtatilgan.",
};

export function denySuspended(identity: RequestIdentity): EntitlementDenial | null {
  if (!identity.suspended) return null;
  return {
    ok: false,
    status: 403,
    code: "ACCOUNT_SUSPENDED",
    error: COPY.suspended,
    title: "Hisob to'xtatilgan",
    cta: COPY.upgradeCta,
    currentPlan: identity.plan,
  };
}

export async function assertFeature(
  identity: RequestIdentity,
  feature: BillingFeature,
): Promise<EntitlementOk | EntitlementDenial> {
  const suspended = denySuspended(identity);
  if (suspended) return suspended;

  const flagMap: Partial<Record<BillingFeature, Parameters<typeof isFlagEnabled>[0]>> = {
    image: "image_generation",
    documents: "document_analysis",
    web_search: "web_search",
    voice: "voice",
    advanced_models: "advanced_models",
    public_sharing: "public_sharing",
  };
  const flag = flagMap[feature];
  if (flag && !(await isFlagEnabled(flag))) {
    return {
      ok: false,
      status: 403,
      code: "FEATURE_DISABLED",
      error: "Bu funksiya hozircha o'chirilgan.",
      title: COPY.disabledTitle,
      cta: COPY.upgradeCta,
      feature,
      currentPlan: identity.plan,
    };
  }

  if (!canUseFeature(identity.plan, feature)) {
    const required = requiredPlanForFeature(feature);
    return {
      ok: false,
      status: 402,
      code: "PLAN_REQUIRED",
      error: `${getPlan(required).name} rejasi talab qilinadi.`,
      title: COPY.upgradeTitle,
      cta: COPY.upgradeCta,
      feature,
      currentPlan: identity.plan,
      requiredPlan: required,
    };
  }

  return { ok: true, plan: identity.plan };
}

export async function assertModelAccess(
  identity: RequestIdentity,
  model: AiModelId,
): Promise<EntitlementOk | EntitlementDenial> {
  const suspended = denySuspended(identity);
  if (suspended) return suspended;
  if (model === "nodir-advanced" && !(await isFlagEnabled("advanced_models"))) {
    return {
      ok: false,
      status: 403,
      code: "FEATURE_DISABLED",
      error: "Murakkab modellar hozircha o'chirilgan.",
      title: COPY.disabledTitle,
      cta: COPY.upgradeCta,
      feature: "advanced_models",
      currentPlan: identity.plan,
    };
  }
  if (!canUseModel(identity.plan, model)) {
    const required = requiredPlanForModel(model);
    return {
      ok: false,
      status: 402,
      code: "PLAN_REQUIRED",
      error: "Tanlangan model joriy tarifda mavjud emas.",
      title: COPY.upgradeTitle,
      cta: COPY.upgradeCta,
      feature: "model",
      currentPlan: identity.plan,
      requiredPlan: required,
    };
  }
  return { ok: true, plan: identity.plan };
}

export function entitlementJson(denial: EntitlementDenial) {
  return Response.json(
    {
      error: denial.error,
      code: denial.code,
      title: denial.title,
      cta: denial.cta,
      feature: denial.feature,
      currentPlan: denial.currentPlan,
      requiredPlan: denial.requiredPlan,
    },
    { status: denial.status },
  );
}
