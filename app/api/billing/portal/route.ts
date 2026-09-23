import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getStripe, isStripeConfigured, STRIPE_UNCONFIGURED } from "@/lib/billing/stripe";
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
  const stripe = getStripe();
  if (!stripe) return Response.json({ error: STRIPE_UNCONFIGURED, code: "STRIPE_UNCONFIGURED" }, { status: 503 });

  if (!isSupabaseConfigured()) {
    return Response.json({ error: STRIPE_UNCONFIGURED, code: "STRIPE_UNCONFIGURED" }, { status: 503 });
  }
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  const { data } = await supabase
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const customer = (data as { provider_customer_id?: string } | null)?.provider_customer_id;
  if (!customer) {
    return Response.json({ error: "Obuna hali yo'q." }, { status: 404 });
  }
  const origin = new URL(request.url).origin;
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${origin}/settings/billing`,
    });
    return Response.json({ url: portal.url });
  } catch {
    return Response.json({ error: "Billing portal ochilmadi." }, { status: 502 });
  }
}
