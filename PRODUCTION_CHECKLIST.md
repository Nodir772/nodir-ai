# Production checklist — Nodir AI

Do not skip these before a public launch. This is an operations list, not marketing copy.

## Environments

- [ ] **dev** — `npm run dev`, `.env.local` only, never production Stripe keys.
- [ ] **test** — Stripe TEST MODE, separate Supabase project or branch, no real customer data.
- [ ] **prod** — production Supabase, live Stripe keys, HTTPS only.

## Environment variables

Required for a working product:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose to the browser)
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SITE_URL` (canonical origin for sitemap, OG, Stripe return URLs)

Stripe (TEST MODE until go-live):

- `STRIPE_SECRET_KEY` (`sk_test_…` in test)
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID` / `STRIPE_PRO_YEARLY_PRICE_ID`
- `STRIPE_PRO_PLUS_PRICE_ID` / `STRIPE_PRO_PLUS_YEARLY_PRICE_ID`
- `STRIPE_PRO_MAX_PRICE_ID` / `STRIPE_PRO_MAX_YEARLY_PRICE_ID`

Optional:

- `ADMIN_EMAILS` — comma-separated admin inbox list
- Plan limit overrides (`FREE_MONTHLY_MESSAGES`, `PRO_MONTHLY_MESSAGES`, …)
- Search / TTS provider keys if those features are enabled

Never commit `.env`, service role keys, or live Stripe secrets.

## Database and RLS

Apply all SQL in `supabase/migrations/` in order, including `006_phase9.sql`, `008_phase11_studio.sql`, and `009_phase12_agents.sql`.

- [ ] RLS is on for profiles, conversations, messages, settings, favorites, notifications, memories, documents, images, tickets.
- [ ] Policies key off `auth.uid()`, not a client-supplied user id.
- [ ] Service role is used only on the server (webhooks, account delete, admin).
- [ ] Confirm a second account cannot read another user's conversations.

## Auth

- [ ] Email confirmation flow tested (if enabled in Supabase).
- [ ] Password reset works with the production site URL.
- [ ] Local cookie session is **disabled** when Supabase is configured.

## Stripe

- [ ] Dashboard is in **TEST MODE** until explicitly going live.
- [ ] Webhook endpoint receives `checkout.session.completed` and subscription updates.
- [ ] Portal return URL is `/settings/billing`.
- [ ] No fake prices or fake “paid” badges in the UI.

## AI and streaming

- [ ] Chat streams (`text/event-stream`) are not buffered (`X-Accel-Buffering: no`).
- [ ] Reverse proxy (nginx / Cloudflare) does not buffer SSE.
- [ ] Stop/cancel aborts the request.
- [ ] User-facing errors never include stack traces or provider internals.

## Security headers

`next.config.ts` and `proxy.ts` set `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and `Permissions-Policy`. Microphone is allowed for voice; camera/geolocation/payment are off.

- [ ] HTTPS in production.
- [ ] HSTS at the host/CDN if not already.

## Rate limits

In-memory limits protect auth (20/min), support (8/min), billing (12/min), and product routes. They are **not** a substitute for Redis/WAF in multi-instance production.

- [ ] Auth is not so tight that legitimate login fails.
- [ ] Chat/search/image scale with plan RPM.

## Privacy and monitoring

- [ ] Logs record latency, status, and error **codes** only.
- [ ] Do not log chat contents, prompts, cookies, passwords, or API keys.
- [ ] Account export (JSON / MD / TXT) and account deletion with confirm work.

## PWA / SEO

- [ ] `/manifest.webmanifest` name is **Nodir AI**.
- [ ] `sitemap.xml` and `robots.txt` exclude `/chat`, `/settings`, `/admin`, `/api`.
- [ ] Theme color matches the dark brand (`#050816`).

## Pre-release commands

```bash
npm run lint
npm run test
npm run build
```

Windows note: `next.config.ts` sets `experimental.cpus: 1` to avoid page-data worker OOM during `next build`.

## Go-live

- [ ] Switch Stripe to live keys only after TEST MODE checkout, portal, cancel, and webhook are verified.
- [ ] Rotate any key that was ever pasted into chat, email, or a ticket.
- [ ] Confirm backups / point-in-time recovery on Supabase.
