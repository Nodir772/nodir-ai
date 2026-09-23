import { getStripe, isStripeConfigured, STRIPE_UNCONFIGURED } from "@/lib/billing/stripe";
import { applyStripeEvent } from "@/lib/billing/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return Response.json({ error: STRIPE_UNCONFIGURED, code: "STRIPE_UNCONFIGURED" }, { status: 503 });
  }
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return Response.json({ error: STRIPE_UNCONFIGURED, code: "STRIPE_UNCONFIGURED" }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Imzo yo'q." }, { status: 400 });
  const payload = await request.text();
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    const result = await applyStripeEvent(event);
    return Response.json({ received: true, duplicate: result.duplicate });
  } catch {
    return Response.json({ error: "Webhook imzosi noto'g'ri." }, { status: 400 });
  }
}
