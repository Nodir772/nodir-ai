import { getRequestIdentity } from "@/lib/auth/request-user";
import { fetchSearchResult, isSearchConfigured, searchWeb } from "@/lib/search";
import { limitRoute } from "@/lib/security/rate-limit";
import { assertFeature, entitlementJson } from "@/lib/billing/entitlements";
import { assertUsage, recordUsage, usageLimitJson } from "@/lib/usage/track";
import { requireUser } from "@/lib/db/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) {
    return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  }
  const limited = limitRoute(request, "search", identity.plan);
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p." }, { status: 429 });
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return Response.json({
      configured: isSearchConfigured(),
      results: [],
      error: isSearchConfigured() ? undefined : "Veb-qidiruv xizmati hali sozlanmagan.",
    });
  }
  const gate = await assertFeature(identity, "web_search");
  if (!gate.ok) return entitlementJson(gate);
  const usage = await assertUsage(request, "search");
  if (!usage.ok) {
    if (usage.code === "USAGE_LIMIT" && "limit" in usage) return usageLimitJson(usage);
    return Response.json({ error: usage.error, code: usage.code }, { status: usage.status });
  }
  const supabase = isSupabaseConfigured() ? (await requireUser()).supabase : null;
  await recordUsage(request, "search", supabase);
  const result = await searchWeb(query);
  return Response.json(result);
}

export async function POST(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) {
    return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  }
  const limited = limitRoute(request, "search", identity.plan);
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p." }, { status: 429 });
  const gate = await assertFeature(identity, "web_search");
  if (!gate.ok) return entitlementJson(gate);
  const body = (await request.json().catch(() => ({}))) as { url?: string };
  const result = await fetchSearchResult(body.url ?? "");
  return Response.json(result);
}
