# Admin setup

Admin pages and APIs are protected on the server. Hiding the Admin nav link is not enough.

## Who is an admin

A user is admin if **either**:

1. `profiles.role = 'admin'`, or
2. Their email is listed in `ADMIN_EMAILS` (comma-separated)

`requireAdmin()` in `lib/admin/auth.ts` runs on every `/api/admin/*` route.

Set the first admin after applying `004_billing_admin.sql`:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

Or in `.env.local`:

```
ADMIN_EMAILS=you@example.com
```

## Pages

- `/admin` — totals
- `/admin/users` — plan, suspend, access (audit logged)
- `/admin/subscriptions`
- `/admin/usage`
- `/admin/system` — provider status + feature flags
- `/admin/audit-logs`
- `/admin/support`

Non-admins receive 403 from APIs and an unauthorized screen from the admin shell.

## Feature flags

Keys: `image_generation`, `document_analysis`, `web_search`, `voice`, `advanced_models`, `public_sharing`

Admins toggle them in `/admin/system`. Protected tools also check flags server-side.

## Usage limits

Daily caps come from `lib/billing/plans.ts` (env overrides such as `FREE_DAILY_MESSAGES`). Usage is counted in `tool_usage` / `usage_records`. Frontend numbers are display-only.

## Audit logs

Plan changes, suspensions, access changes, billing admin actions, and flag changes write to `audit_logs`. Passwords, API keys, and card data are never stored there.

## Service role

`SUPABASE_SERVICE_ROLE_KEY` is required for admin lists, webhooks, and audit writes. Keep it server-only. Never prefix it with `NEXT_PUBLIC_`.
