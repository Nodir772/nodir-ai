import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getPlan, recommendedUpgrade } from "@/lib/billing/plans";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { getUsageDashboard } from "@/lib/usage/track";
import { listFlags } from "@/lib/billing/flags";
import { isAdminIdentity } from "@/lib/admin/auth";

export async function GET(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  const supabase = isSupabaseConfigured() ? (await requireUser()).supabase : null;
  const usage = await getUsageDashboard(request, supabase);
  let subscription = null;
  if (supabase) {
    const { data } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end, cancel_at_period_end, provider")
      .eq("user_id", identity.id)
      .maybeSingle();
    subscription = data;
  }
  const flags = await listFlags();
  return Response.json({
    plan: identity.plan,
    planConfig: getPlan(identity.plan),
    admin: isAdminIdentity(identity),
    suspended: Boolean(identity.suspended),
    stripeConfigured: isStripeConfigured(),
    recommendedUpgrade: recommendedUpgrade(identity.plan),
    usage,
    subscription,
    flags,
  });
}
