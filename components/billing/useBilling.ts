"use client";

import { useEffect, useState } from "react";
import type { AiModelId } from "@/lib/ai/models";
import type { PlanId } from "@/lib/billing/plans";

export type UsageMeter = {
  used: number;
  limit: number;
  remaining: number | null;
  percent: number;
  unbounded?: boolean;
};

export type BillingMe = {
  plan: PlanId;
  planConfig: {
    name: string;
    allowedModels: AiModelId[];
    price: number;
    yearlyPrice: number;
    monthlyPrice?: number;
  };
  admin: boolean;
  suspended: boolean;
  stripeConfigured: boolean;
  recommendedUpgrade: { plan: PlanId; name: string; price: number; yearlyPrice: number } | null;
  usage: {
    plan: string;
    planName: string;
    day: string;
    periodStart: string;
    periodEnd: string;
    resetAt: string;
    messages: UsageMeter;
    images: UsageMeter;
    documents: UsageMeter;
    searches: UsageMeter;
    voice: UsageMeter;
    tools: Record<string, number>;
    recommendedUpgrade: { plan: PlanId; name: string; price: number; yearlyPrice: number } | null;
    highestPlan: boolean;
  } | null;
  subscription: {
    plan: string;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    provider: string;
  } | null;
  flags: { key: string; enabled: boolean }[];
};

export function useBilling() {
  const [data, setData] = useState<BillingMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/billing/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((json: BillingMe | null) => {
        if (!cancelled) setData(json);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}
