import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { ensureProfile } from "@/lib/db/profiles";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getStripe, isStripeConfigured, isStripePriceConfigured, stripePriceId, STRIPE_UNCONFIGURED } from "@/lib/billing/stripe";
import { isPaidPlan, resolvePlanId } from "@/lib/billing/plans";
import { limitRoute } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const limited = limitRoute(request, "billing");
  if (!limited.ok) {
    return Response.json({ error: "Juda ko'p so'rov yuborildi. Biroz kuting.", code: "RATE_LIMIT" }, { status: 429 });
  }
  if (!isStripeConfigured()) {
    return Response.json({ error: STRIPE_UNCONFIGURED, code: "STRIPE_UNCONFIGURED" }, { status: 503 });
  }
  const identity = await getRequestIdentity(request);
  if (!identity) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  if (identity.suspended) return Response.json({ error: "Hisob to'xtatilgan." }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { plan?: string; interval?: string };
  const plan = resolvePlanId(body.plan);
  if (!isPaidPlan(plan)) {
    return Response.json({ error: "Free reja to'lov talab qilmaydi." }, { status: 400 });
  }
  const interval = body.interval === "year" ? "year" : "month";
  if (!isStripePriceConfigured(plan, interval)) {
    return Response.json({ error: STRIPE_UNCONFIGURED, code: "STRIPE_UNCONFIGURED" }, { status: 503 });
  }
  const price = stripePriceId(plan, interval);
  if (!price) {
    return Response.json({ error: STRIPE_UNCONFIGURED, code: "STRIPE_UNCONFIGURED" }, { status: 503 });
  }

  const stripe = getStripe();
  if (!stripe) return Response.json({ error: STRIPE_UNCONFIGURED, code: "STRIPE_UNCONFIGURED" }, { status: 503 });

  const origin = new URL(request.url).origin;
  let customerId: string | undefined;
  if (isSupabaseConfigured()) {
    const { user, supabase } = await requireUser();
    if (user && supabase) {
      await ensureProfile(supabase, user);
      const { data } = await supabase
        .from("subscriptions")
        .select("provider_customer_id")
        .eq("user_id", user.id)
        .maybeSingle();
      customerId = (data as { provider_customer_id?: string } | null)?.provider_customer_id || undefined;
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/settings/billing?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      client_reference_id: identity.id,
      customer: customerId,
      metadata: { user_id: identity.id, plan },
      subscription_data: { metadata: { user_id: identity.id, plan } },
    });
    return Response.json({ url: session.url });
  } catch {
    return Response.json({ error: "To'lov sessiyasini ochib bo'lmadi." }, { status: 502 });
  }
}
