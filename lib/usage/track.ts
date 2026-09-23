import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getRequestIdentity } from "@/lib/auth/request-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getPlan, recommendedUpgrade } from "@/lib/billing/plans";
import { createServiceClient } from "@/lib/billing/flags";
import { billingPeriod, periodKey, type BillingPeriod } from "@/lib/usage/period";
import {
  LIMIT_COPY,
  capForTool,
  isMessageUsageTool,
  usageFeatureKeys,
  usageSnapshot,
  type UsageTool,
} from "@/lib/usage/config";

const memory = new Map<string, { amount: number; period: string }>();

function memoryKey(userId: string, tool: UsageTool, period: BillingPeriod) {
  return `${periodKey(period)}:${userId}:${tool}`;
}

async function loadSubscriptionPeriod(userId: string, supabase?: SupabaseClient | null): Promise<BillingPeriod> {
  const admin = createServiceClient() ?? supabase;
  if (!isSupabaseConfigured() || !admin) return billingPeriod();
  try {
    const { data } = await admin
      .from("subscriptions")
      .select("current_period_start, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();
    return billingPeriod(data as { current_period_start?: string | null; current_period_end?: string | null } | null);
  } catch {
    return billingPeriod();
  }
}

async function usedInPeriod(
  userId: string,
  tool: UsageTool,
  period: BillingPeriod,
  supabase?: SupabaseClient | null,
) {
  const keys = usageFeatureKeys(tool);
  const admin = createServiceClient() ?? supabase;
  if (isSupabaseConfigured() && admin) {
    const { data, error } = await admin
      .from("usage_records")
      .select("amount, feature")
      .eq("user_id", userId)
      .in("feature", keys)
      .gte("created_at", period.start.toISOString())
      .lt("created_at", period.end.toISOString());
    if (!error && data) {
      return data.reduce((sum, row) => sum + (typeof row.amount === "number" ? row.amount : 1), 0);
    }
    const { count } = await admin
      .from("tool_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("tool", keys)
      .gte("created_at", period.start.toISOString())
      .lt("created_at", period.end.toISOString());
    return count ?? 0;
  }

  return keys.reduce((sum, key) => sum + (memory.get(memoryKey(userId, key, period))?.amount ?? 0), 0);
}

export type UsageDecision =
  | { ok: true }
  | {
      ok: false;
      status: 429;
      error: string;
      code: "USAGE_LIMIT";
      title: string;
      cta: string;
      waitCta: string;
      currentPlan: string;
      used: number;
      limit: number;
      remaining: number;
      resetAt: string;
      recommendedPlan: string | null;
      recommendedName: string | null;
      recommendedPrice: number | null;
    };

function limitDecision(
  plan: string,
  _tool: UsageTool,
  used: number,
  cap: number,
  period: BillingPeriod,
): Extract<UsageDecision, { ok: false }> {
  const next = recommendedUpgrade(plan);
  return {
    ok: false,
    status: 429,
    error: LIMIT_COPY.body,
    code: "USAGE_LIMIT",
    title: LIMIT_COPY.title,
    cta: next ? `${next.name} — $${next.price}/oy` : LIMIT_COPY.cta,
    waitCta: LIMIT_COPY.wait,
    currentPlan: plan,
    used,
    limit: cap,
    remaining: 0,
    resetAt: period.resetAt.toISOString(),
    recommendedPlan: next?.plan ?? null,
    recommendedName: next?.name ?? null,
    recommendedPrice: next?.price ?? null,
  };
}

export function usageLimitJson(decision: Extract<UsageDecision, { ok: false }>) {
  return Response.json(
    {
      error: decision.error,
      code: decision.code,
      title: decision.title,
      cta: decision.cta,
      waitCta: decision.waitCta,
      currentPlan: decision.currentPlan,
      used: decision.used,
      limit: decision.limit,
      remaining: decision.remaining,
      resetAt: decision.resetAt,
      recommendedPlan: decision.recommendedPlan,
      recommendedName: decision.recommendedName,
      recommendedPrice: decision.recommendedPrice,
    },
    { status: decision.status },
  );
}

export async function assertUsage(request: Request, tool: UsageTool, supabase?: SupabaseClient | null, amount = 1) {
  const identity = await getRequestIdentity(request);
  if (!identity) {
    return { ok: false as const, status: 401 as const, error: "Davom etish uchun tizimga kiring.", code: "UNAUTHORIZED" as const };
  }
  if (identity.suspended) {
    return { ok: false as const, status: 403 as const, error: "Hisob to'xtatilgan.", code: "ACCOUNT_SUSPENDED" as const };
  }
  if (!isSupabaseConfigured()) {
    return { ok: true as const, identity };
  }

  const cap = capForTool(identity.plan, tool);
  if (cap === 0) return { ok: true as const, identity };

  const period = await loadSubscriptionPeriod(identity.id, supabase);
  const used = await usedInPeriod(identity.id, tool, period, supabase);

  if (used + amount > cap + 1e-9) {
    return { ...limitDecision(identity.plan, tool, used, cap, period), identity };
  }

  return { ok: true as const, identity, used, cap, period };
}

export async function recordUsage(
  request: Request,
  tool: UsageTool,
  supabase?: SupabaseClient | null,
  amount = 1,
) {
  const identity = await getRequestIdentity(request);
  if (!identity) return;
  const period = await loadSubscriptionPeriod(identity.id, supabase);
  const feature = isMessageUsageTool(tool) ? "chat" : tool;

  if (isSupabaseConfigured() && supabase) {
    await supabase.from("tool_usage").insert({ user_id: identity.id, tool });
    const writer = createServiceClient() ?? supabase;
    try {
      await writer.from("usage_records").insert({
        user_id: identity.id,
        feature,
        amount,
        period_start: period.start.toISOString(),
        period_end: period.end.toISOString(),
        metadata: { tool },
      });
      await writer.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", identity.id);
    } catch {
      /* optional phase-7/8 tables */
    }
    return;
  }

  const key = memoryKey(identity.id, feature, period);
  const current = memory.get(key);
  const stamp = periodKey(period);
  if (!current || current.period !== stamp) {
    memory.set(key, { amount, period: stamp });
    return;
  }
  current.amount += amount;
}

export async function getUsageDashboard(request: Request, supabase?: SupabaseClient | null) {
  const identity = await getRequestIdentity(request);
  if (!identity) return null;

  const period = await loadSubscriptionPeriod(identity.id, supabase);
  const plan = getPlan(identity.plan);
  const next = recommendedUpgrade(identity.plan);

  const [messages, images, documents, searches, voice] = await Promise.all([
    usedInPeriod(identity.id, "chat", period, supabase),
    usedInPeriod(identity.id, "image", period, supabase),
    usedInPeriod(identity.id, "documents", period, supabase),
    usedInPeriod(identity.id, "search", period, supabase),
    usedInPeriod(identity.id, "voice", period, supabase),
  ]);

  const tools: UsageTool[] = ["chat", "image", "documents", "translate", "writer", "code", "summarizer", "search", "voice"];
  const toolCounts: Record<string, number> = {};
  for (const tool of tools) {
    if (isMessageUsageTool(tool) && tool !== "chat") {
      toolCounts[tool] = 0;
      continue;
    }
    toolCounts[tool] = await usedInPeriod(identity.id, tool, period, supabase);
  }
  toolCounts.chat = messages;

  return {
    plan: identity.plan,
    planName: plan.name,
    periodStart: period.start.toISOString(),
    periodEnd: period.end.toISOString(),
    resetAt: period.resetAt.toISOString(),
    day: periodKey(period),
    messages: usageSnapshot(messages, plan.aiMessages),
    images: usageSnapshot(images, plan.imageGenerations),
    documents: usageSnapshot(documents, plan.documentAnalyses),
    searches: usageSnapshot(searches, plan.webSearches),
    voice: usageSnapshot(voice, plan.voiceMinutes),
    tools: toolCounts,
    recommendedUpgrade: next,
    highestPlan: next === null,
  };
}
