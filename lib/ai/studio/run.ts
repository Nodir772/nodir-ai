import "server-only";

import { completeAiText, requestTimeoutSignal, streamAiResponse } from "@/lib/ai/complete";
import { CONTEXT_LIMITS, isAllowedModelId, resolveProviderModel } from "@/lib/ai/config";
import { DEFAULT_MODEL_ID, type AiModelId } from "@/lib/ai/models";
import { USER_ERRORS } from "@/lib/ai/errors";
import { getRequestIdentity } from "@/lib/auth/request-user";
import { assertFeature, assertModelAccess, entitlementJson } from "@/lib/billing/entitlements";
import type { BillingFeature } from "@/lib/billing/plans";
import { requireUser } from "@/lib/db/auth";
import { limitRoute } from "@/lib/security/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { assertUsage, recordUsage, usageLimitJson } from "@/lib/usage/track";
import type { UsageTool } from "@/lib/usage/config";

export type StudioRunInput = {
  request: Request;
  feature: BillingFeature;
  usageTool: UsageTool;
  model?: string;
  input: string;
  systemAddon: string;
  stream?: boolean;
};

export async function runStudioText(input: StudioRunInput) {
  const limited = limitRoute(input.request, "chat");
  if (!limited.ok) {
    return { ok: false as const, response: Response.json({ error: USER_ERRORS.rateLimit, code: "RATE_LIMIT" }, { status: 429 }) };
  }
  const identity = await getRequestIdentity(input.request);
  if (!identity) {
    return { ok: false as const, response: Response.json({ error: "Davom etish uchun tizimga kiring.", code: "UNAUTHORIZED" }, { status: 401 }) };
  }
  const planLimit = limitRoute(input.request, "chat", identity.plan);
  if (!planLimit.ok) {
    return { ok: false as const, response: Response.json({ error: USER_ERRORS.rateLimit, code: "RATE_LIMIT" }, { status: 429 }) };
  }
  const gate = await assertFeature(identity, input.feature);
  if (!gate.ok) return { ok: false as const, response: entitlementJson(gate) };

  const modelId: AiModelId = isAllowedModelId(input.model ?? "") ? (input.model as AiModelId) : DEFAULT_MODEL_ID;
  const modelGate = await assertModelAccess(identity, modelId);
  if (!modelGate.ok) return { ok: false as const, response: entitlementJson(modelGate) };

  const text = input.input.trim();
  if (!text) {
    return { ok: false as const, response: Response.json({ error: "Matn bo'sh bo'lmasligi kerak.", code: "INVALID_INPUT" }, { status: 400 }) };
  }
  if (text.length > CONTEXT_LIMITS.maxRequestChars) {
    return { ok: false as const, response: Response.json({ error: "So'rov haddan tashqari katta.", code: "INVALID_INPUT" }, { status: 400 }) };
  }

  const { supabase } = isSupabaseConfigured() ? await requireUser() : { supabase: null };
  const usage = await assertUsage(input.request, input.usageTool, supabase);
  if (!usage.ok) {
    if (usage.code === "USAGE_LIMIT" && "limit" in usage) {
      return { ok: false as const, response: usageLimitJson(usage) };
    }
    return { ok: false as const, response: Response.json({ error: usage.error, code: usage.code }, { status: usage.status }) };
  }

  await recordUsage(input.request, input.usageTool, supabase);
  const history = [{ role: "user" as const, content: text }];
  const signal = requestTimeoutSignal(input.request);

  const providerModel = resolveProviderModel(modelId);
  if (input.stream !== false) {
    return {
      ok: true as const,
      response: streamAiResponse(history, providerModel, input.systemAddon, signal),
      identity,
      modelId,
    };
  }

  const completed = await completeAiText(history, input.systemAddon, modelId, signal);
  if (!completed.ok) {
    return { ok: false as const, response: Response.json({ error: completed.error, code: completed.code }, { status: completed.status }) };
  }
  return { ok: true as const, response: Response.json({ text: completed.text }), identity, modelId, text: completed.text };
}
