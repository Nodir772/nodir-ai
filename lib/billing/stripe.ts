import "server-only";

import Stripe from "stripe";
import { isPaidPlan, type PaidPlanId } from "@/lib/billing/plans";

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function stripePriceId(plan: PaidPlanId, interval: "month" | "year") {
  if (plan === "pro" && interval === "month") return env("STRIPE_PRO_PRICE_ID");
  if (plan === "pro" && interval === "year") return env("STRIPE_PRO_YEARLY_PRICE_ID") || env("STRIPE_PRO_PRICE_ID");
  if (plan === "pro_plus" && interval === "month") return env("STRIPE_PRO_PLUS_PRICE_ID");
  if (plan === "pro_plus" && interval === "year") {
    return env("STRIPE_PRO_PLUS_YEARLY_PRICE_ID") || env("STRIPE_PRO_PLUS_PRICE_ID");
  }
  if (plan === "pro_max" && interval === "month") {
    return env("STRIPE_PRO_MAX_PRICE_ID") || env("STRIPE_PREMIUM_PRICE_ID");
  }
  return env("STRIPE_PRO_MAX_YEARLY_PRICE_ID") || env("STRIPE_PREMIUM_YEARLY_PRICE_ID") || env("STRIPE_PRO_MAX_PRICE_ID") || env("STRIPE_PREMIUM_PRICE_ID");
}

export function isStripeConfigured() {
  return Boolean(
    env("STRIPE_SECRET_KEY") &&
      env("STRIPE_PRO_PRICE_ID") &&
      env("STRIPE_PRO_PLUS_PRICE_ID") &&
      (env("STRIPE_PRO_MAX_PRICE_ID") || env("STRIPE_PREMIUM_PRICE_ID")),
  );
}

export function isStripePriceConfigured(plan: string, interval: "month" | "year") {
  if (!isPaidPlan(plan)) return false;
  return Boolean(stripePriceId(plan, interval));
}

let client: Stripe | null = null;

export function getStripe() {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) return null;
  if (!client) {
    client = new Stripe(key, { typescript: true });
  }
  return client;
}

export const STRIPE_UNCONFIGURED = "To'lov xizmati hali sozlanmagan. Stripe TEST MODE kalitlari kerak.";
