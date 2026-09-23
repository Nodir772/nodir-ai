# Nodir AI

Premium conversational AI platform.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Supabase setup (project URL, anon key, SQL migration, persistence checks): [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

Tools and limits: [TOOLS.md](./TOOLS.md). Phase 6 memory, search, voice: same file.

## Environment

Copy `.env.example` to `.env.local` and set server-only secrets there:

```
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- Never put `OPENAI_API_KEY` in client code.
- Never use `NEXT_PUBLIC_OPENAI_API_KEY`.
- Never expose a Supabase service-role key with `NEXT_PUBLIC_`.
- The app runs without these values, but chat cannot call OpenAI until `OPENAI_API_KEY` is set.

After changing `.env.local`:

1. Stop the development server.
2. Start it again with `npm run dev`.

Next.js reads environment files when the Node process starts. Saving `.env.local` is not enough by itself.

### Auth without Supabase

If Supabase keys are empty, `/login` and `/register` create a **local development session** cookie and show a setup notice. `/chat` stays protected. This is not production auth.

When keys are set, Supabase Auth is used. Conversations and messages persist in Postgres with RLS.

### Chat and OpenAI

Sending a message calls `POST /api/chat`. If `OPENAI_API_KEY` is missing, the UI shows a configuration error — not a fake model reply. Check `GET /api/ai/status` (`openaiConfigured` only). Do not paste API keys into the chat box.

## Routes

| Route | Status |
| --- | --- |
| `/` | Landing (Phase 1) |
| `/login`, `/register`, `/forgot-password` | Auth (Phase 2) |
| `/chat` | Chat workspace (protected, persisted when Supabase is configured) |
| `/chat/[conversationId]` | Same workspace, selected conversation |
| `/tools/*` | Image, documents, translate, writer, code, summarizer |
| `/s/[token]` | Public shared AI reply (only if explicitly shared) |
| `/pricing` | UI-only plans |
| `/about` | Brand |
| `/settings` | Placeholder; profile/theme/AI settings live in the chat settings modal |

## Avatar

`public/images/nodir-avatar.jpg`
