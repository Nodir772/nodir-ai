# Billing setup

Nodir AI subscriptions are server-side. The browser never decides plan, usage, or payment success.

## Plans

Central config: `lib/billing/plans.ts`

| Plan | Monthly | Yearly | Models | Notable limits |
| --- | --- | --- | --- | --- |
| Free | $0 | $0 | Fast | 50 messages, 5 images, 3 docs, 10 searches, 30 voice min |
| Pro | $7 | $70 | Fast + Balanced | 2 000 / 50 / 30 / 100 / 300 |
| Pro Plus | $10 | $100 | All models (Most Popular) | 5 000 / 150 / 100 / 300 / 1 000 |
| Pro Max | $15 | $150 | All models | 10 000 / 400 / 250 / 700 / 2 000 |

Yearly billing saves 2 months. Plan IDs: `free` \| `pro` \| `pro_plus` \| `pro_max`.

Limits, allowed models, tools, rate limits, file size, and context level live only in that file (plus env overrides). Do not hardcode caps in UI components.

Usage is counted per **monthly billing period** (subscription period when present, otherwise UTC calendar month).

## Database

Apply `supabase/migrations/004_billing_admin.sql`, then `supabase/migrations/005_phase8_plans.sql`.

Migration 005 maps legacy `premium` rows to `pro_max` and expands the plan check to `free | pro | pro_plus | pro_max`. Existing free users are unchanged.

Tables:

- `subscriptions` — provider IDs, plan, status, period
- `usage_records` — feature usage per period
- `billing_events` — Stripe event idempotency (`event_id` unique)
- `feature_flags` — global on/off switches
- `support_tickets`, `audit_logs`

RLS: users can `SELECT` their own `subscriptions` and `usage_records`, and manage only their own tickets. `billing_events` and `audit_logs` have no client policies (service role only).

## Entitlements

`lib/billing/entitlements.ts` runs on the server for chat, tools, images, documents, search, voice, and sharing.

Order of checks: authenticate → feature flag → plan entitlement → usage limit → execute → record usage.

The browser cannot spoof a plan. Identity comes from the session/profile on the server.

## Stripe TEST MODE

1. Create a Stripe **test** account (not live).
2. Copy test secret key to `STRIPE_SECRET_KEY`.
3. Create recurring prices for Pro, Pro Plus, and Pro Max. Put IDs in:
   - `STRIPE_PRO_PRICE_ID`
   - `STRIPE_PRO_PLUS_PRICE_ID`
   - `STRIPE_PRO_MAX_PRICE_ID`
4. Optional yearly IDs: `STRIPE_PRO_YEARLY_PRICE_ID`, `STRIPE_PRO_PLUS_YEARLY_PRICE_ID`, `STRIPE_PRO_MAX_YEARLY_PRICE_ID`.
5. Webhook endpoint: `POST /api/billing/webhook`
6. Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
7. Set `STRIPE_WEBHOOK_SECRET` from the webhook signing secret.

If Stripe env vars are missing, the app still runs. Checkout returns `STRIPE_UNCONFIGURED`. The UI does **not** fake a successful payment.

**Live billing** requires an authorized adult/business owner to configure the real Stripe account, tax, and legal details. Do not enable live keys in this project without that.

## Routes

- `POST /api/billing/checkout` — Stripe Checkout (authenticated)
- `POST /api/billing/portal` — Customer Portal (authenticated)
- `POST /api/billing/webhook` — **unauthenticated**; signature verified
- `GET /api/billing/me` — current plan, usage, flags (authenticated)

Never trust `?checkout=success` in the URL. Plan changes apply only after a verified webhook.
