# Supabase setup — Nodir AI

This connects authentication, profiles, conversations, messages, and settings. Do not put secrets in this file.

## 1. Create a Supabase project

1. Open [https://supabase.com](https://supabase.com) and create a project.
2. Wait until the database is ready.

## 2. Find the project URL

In the dashboard: **Project Settings → API → Project URL**.

It looks like `https://xxxxxxxx.supabase.co`.

## 3. Find the anon / public key

Same page: **anon public** key.

This key is safe to expose in the browser only because Row Level Security is enabled. Never use the **service_role** key in Next.js `NEXT_PUBLIC_*` variables or client code.

## 4. Add environment variables

Copy `.env.example` to `.env.local` in the Next.js project root (the folder that contains `package.json`) and set the public values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Use the exact names above. Do not put the service-role key in either variable, and do not create a `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`. `SUPABASE_SERVICE_ROLE_KEY`, if you add it later for server-only admin work, stays without a `NEXT_PUBLIC_` prefix.

Keep `OPENAI_API_KEY` on the server only (no `NEXT_PUBLIC_` prefix).

`NEXT_PUBLIC_*` values are read when the Node process starts. Saving `.env.local` does not update a server that is already running.

If either public value is empty, the app still starts and shows **Supabase konfiguratsiyasi topilmadi.** Auth then uses a local development session and chats stay in the browser. That path is only for an unconfigured environment. As soon as both values are valid, the app uses Supabase auth and the database, and it does not create a local development session.

Check configuration without printing secrets:

```
GET /api/supabase/status
```

The response is only `{ "supabaseConfigured": true }` or `{ "supabaseConfigured": false }`.

## 5. Run the SQL migrations

In the Supabase SQL editor, run every file in `supabase/migrations/` in filename order. Do not recreate tables that already exist; the scripts use `create table if not exists`.

1. `supabase/migrations/001_initial_schema.sql` — `profiles`, `conversations`, `messages`, `user_settings`, RLS
2. `supabase/migrations/002_tools_platform.sql`
3. `supabase/migrations/003_phase6.sql` — `memories`, shared conversations
4. `supabase/migrations/004_billing_admin.sql` — `subscriptions`, `usage_records`, `audit_logs`
5. `supabase/migrations/005_phase8_plans.sql`
6. `supabase/migrations/006_phase9.sql` — `notifications`
7. `supabase/migrations/007_phase10.sql` — `projects`
8. `supabase/migrations/008_phase11_studio.sql`
9. `supabase/migrations/009_phase12_agents.sql` — `agents`, `tasks`, `task_steps`, `automations`
10. `supabase/migrations/010_phase13_finish.sql`

Row Level Security is enabled in these migrations. Policies key off `auth.uid()`, so a user can only read and write their own private rows unless a share token is used.

## 6. Restart the Next.js application

Stop the development server, then start it again so `.env.local` is loaded:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). After this restart, `/login` must not show the missing-configuration notice, and `/api/supabase/status` must return `{ "supabaseConfigured": true }`.

## 7. Test registration

1. Open `/register`.
2. Create an account.
3. Confirm email if your project requires it, then sign in.

A `profiles` row and a `user_settings` row should appear for that user.

## 8. Test creating a conversation

1. Open `/chat`.
2. Click **+ Yangi suhbat**.
3. A row should appear in `conversations` with title `Yangi suhbat`.
4. The URL can become `/chat/<conversation-id>` without a full page reload.

## 9. Test sending a message

1. Send a real question.
2. Confirm a `user` row in `messages`.
3. If `OPENAI_API_KEY` is set, the assistant stream should finish and save an `assistant` row.
4. If generation is stopped or fails, an incomplete assistant reply is **not** stored.

## 10. Test chat persistence

1. Refresh `/chat`.
2. The conversation remains in the sidebar (Bugun / Kecha / Oldinroq).
3. Open it: messages load in order.
4. Rename the title and refresh — the new title remains.
5. Delete the conversation — it disappears and a new empty chat opens.
6. Log out and log in — the same user’s conversations remain.

## Security notes

- Server routes authenticate with the Supabase session cookie. They never trust a client-sent `user_id`.
- Conversation ownership is checked before loading history, saving messages, renaming, or deleting.
- AI context is loaded from the database when Supabase is configured, not from a client-supplied history array.
