import type { PaidPlanId, PlanId } from "@/lib/billing/plans";
import { resolvePlanId } from "@/lib/billing/plans";

export function profilePlanForSubscription(status: string, plan: PlanId): PlanId {
  if (status === "active" || status === "trialing") return plan;
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") return "free";
  return plan;
}

export function billingEventInsertResult(error: { code?: string } | null | undefined) {
  if (error?.code === "23505") return { duplicate: true as const };
  return { duplicate: false as const };
}

export type StripePriceMap = {
  pro?: string;
  proYear?: string;
  proPlus?: string;
  proPlusYear?: string;
  proMax?: string;
  proMaxYear?: string;
  /** @deprecated Legacy Premium monthly price. Mapped to Pro Max. */
  premium?: string;
  /** @deprecated Legacy Premium yearly price. Mapped to Pro Max. */
  premiumYear?: string;
};

export function planFromStripePriceId(priceId: string | undefined, ids: StripePriceMap): PlanId {
  if (!priceId) return "free";
  if (priceId === ids.proMax || priceId === ids.proMaxYear || priceId === ids.premium || priceId === ids.premiumYear) {
    return "pro_max";
  }
  if (priceId === ids.proPlus || priceId === ids.proPlusYear) return "pro_plus";
  if (priceId === ids.pro || priceId === ids.proYear) return "pro";
  return "free";
}

export function paidPlanFromCheckout(value: string | null | undefined): PaidPlanId {
  const plan = resolvePlanId(value);
  return plan === "free" ? "pro" : plan;
}
