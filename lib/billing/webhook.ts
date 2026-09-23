import "server-only";

import type Stripe from "stripe";
import { createServiceClient } from "@/lib/billing/flags";
import { type PlanId } from "@/lib/billing/plans";
import {
  billingEventInsertResult,
  paidPlanFromCheckout,
  planFromStripePriceId,
  profilePlanForSubscription,
} from "@/lib/billing/subscription-state";

function subscriptionPeriods(sub: Stripe.Subscription) {
  const item = sub.items.data[0] as { current_period_start?: number; current_period_end?: number } | undefined;
  const raw = sub as unknown as { current_period_start?: number; current_period_end?: number };
  return {
    start: raw.current_period_start ?? item?.current_period_start,
    end: raw.current_period_end ?? item?.current_period_end,
  };
}

function planFromPrice(priceId: string | undefined): PlanId {
  return planFromStripePriceId(priceId, {
    pro: process.env.STRIPE_PRO_PRICE_ID?.trim(),
    proYear: process.env.STRIPE_PRO_YEARLY_PRICE_ID?.trim(),
    proPlus: process.env.STRIPE_PRO_PLUS_PRICE_ID?.trim(),
    proPlusYear: process.env.STRIPE_PRO_PLUS_YEARLY_PRICE_ID?.trim(),
    proMax: process.env.STRIPE_PRO_MAX_PRICE_ID?.trim(),
    proMaxYear: process.env.STRIPE_PRO_MAX_YEARLY_PRICE_ID?.trim(),
    premium: process.env.STRIPE_PREMIUM_PRICE_ID?.trim(),
    premiumYear: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID?.trim(),
  });
}

export async function rememberBillingEvent(eventId: string, eventType: string) {
  const admin = createServiceClient();
  if (!admin) {
    return { duplicate: false, persist: false };
  }
  const { error } = await admin.from("billing_events").insert({
    provider: "stripe",
    event_id: eventId,
    event_type: eventType,
    processed: true,
  });
  if (error) {
    return { ...billingEventInsertResult(error), persist: true };
  }
  return { duplicate: false, persist: true };
}

async function upsertSubscription(input: {
  userId: string;
  customerId?: string;
  subscriptionId?: string;
  plan: PlanId;
  status: string;
  periodStart?: number | null;
  periodEnd?: number | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const admin = createServiceClient();
  if (!admin) return;
  await admin.from("subscriptions").upsert(
    {
      user_id: input.userId,
      provider: "stripe",
      provider_customer_id: input.customerId ?? null,
      provider_subscription_id: input.subscriptionId ?? null,
      plan: input.plan,
      status: input.status,
      current_period_start: input.periodStart ? new Date(input.periodStart * 1000).toISOString() : null,
      current_period_end: input.periodEnd ? new Date(input.periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: Boolean(input.cancelAtPeriodEnd),
    },
    { onConflict: "user_id" },
  );
  const nextPlan = profilePlanForSubscription(input.status, input.plan);
  if (nextPlan !== "free" || input.status === "canceled" || input.status === "unpaid" || input.status === "incomplete_expired") {
    await admin.from("profiles").update({ plan: nextPlan }).eq("id", input.userId);
  }
}

export async function applyStripeEvent(event: Stripe.Event) {
  const seen = await rememberBillingEvent(event.id, event.type);
  if (seen.duplicate) return { ok: true, duplicate: true };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || (session.metadata?.user_id as string | undefined);
      if (!userId) break;
      const plan = paidPlanFromCheckout(session.metadata?.plan);
      await upsertSubscription({
        userId,
        customerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
        subscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
        plan,
        status: "active",
      });
      const notify = createServiceClient();
      if (notify) {
        await notify
          .from("notifications")
          .insert({
            user_id: userId,
            category: "billing",
            title: "Obuna yangilandi",
            body: `${plan} rejasi faol.`,
          })
          .then(() => undefined, () => undefined);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (!userId) break;
      const priceId = sub.items.data[0]?.price?.id;
      const periods = subscriptionPeriods(sub);
      await upsertSubscription({
        userId,
        customerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        subscriptionId: sub.id,
        plan: planFromPrice(priceId),
        status: sub.status,
        periodStart: periods.start,
        periodEnd: periods.end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (!userId) break;
      await upsertSubscription({
        userId,
        customerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        subscriptionId: sub.id,
        plan: "free",
        status: "canceled",
        cancelAtPeriodEnd: false,
      });
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
        parent?: { subscription_details?: { metadata?: { user_id?: string } } };
      };
      const userId =
        invoice.parent?.subscription_details?.metadata?.user_id ||
        (typeof invoice.subscription === "object" && invoice.subscription
          ? invoice.subscription.metadata?.user_id
          : undefined);
      if (!userId) break;
      const admin = createServiceClient();
      if (admin) {
        await admin.from("subscriptions").update({ status: "past_due" }).eq("user_id", userId);
      }
      break;
    }
    default:
      break;
  }

  return { ok: true, duplicate: false };
}
