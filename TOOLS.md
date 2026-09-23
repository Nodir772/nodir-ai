# Nodir AI tools

Unified workspaces:

- `/chat` — AI Chat
- `/tools/image` — image generation
- `/tools/documents` — PDF / TXT / DOCX
- `/tools/translate`
- `/tools/writer`
- `/tools/code`
- `/tools/summarizer`

All tools use the same sidebar, theme, and Nodir AI branding.

## AI provider

`OPENAI_API_KEY` (server only) powers chat, translation, writing, code, summarizer, and document Q&A.

`OPENAI_IMAGE_MODEL` (optional, default `dall-e-3`) is used only if image generation is requested. If the key is missing, the image tool shows: **Rasm yaratish xizmati hali sozlanmagan.**

## Files

Allowed: PDF, TXT, DOCX (and images as chat attachments). Max size: 8 MB. Types are checked from file bytes, not only the browser MIME type. Uploaded/generated code is never executed.

## Usage limits

Configured in `lib/usage/config.ts` via:

- `FREE_DAILY_MESSAGES` / `FREE_MESSAGES_PER_DAY`
- `FREE_DAILY_IMAGE_GENERATIONS` / `FREE_IMAGE_GENERATIONS_PER_DAY`
- `FREE_DOCUMENT_LIMIT` / `FREE_DOCUMENTS_PER_DAY`

When a free user hits a cap, the UI shows **Kunlik limit tugadi** and a link to `/pricing` (pricing remains UI-only; no payments).

## Supabase storage

After running `supabase/migrations/002_tools_platform.sql` and `003_phase6.sql`:

- Private buckets: `generated-images`, `documents`
- Tables: `tool_usage`, `generated_images`, `documents`, `favorites`, `shared_messages`, `memories`, `shared_conversations`
- `user_settings` extensions: memory, persona, voice, notification prefs
- Paths are `{user_id}/...`. Signed URLs are created only for the owner.

## Web search

`lib/search/` supports `tavily`, `brave`, and `serper` when `SEARCH_PROVIDER` and `SEARCH_API_KEY` are set. Results are wrapped as untrusted data. The app does not invent citations. Webpage fetches block private hosts and never execute JavaScript.

## Voice

Chat microphone and `/voice` use the browser Speech Recognition API. Text is **not** sent until the user presses Send.

TTS requires `TTS_PROVIDER=openai` (uses `OPENAI_API_KEY`) or another key later. Otherwise the UI shows: **Ovozli javob xizmati hali sozlanmagan.**

## Memory

`/settings/memory` — optional, user-controlled. Secrets and credentials are rejected. Chat uses only relevant memories, not the full list.

## Shortcuts

- Enter send · Shift+Enter newline
- Ctrl/Cmd+K command palette
- Ctrl/Cmd+Shift+O new chat
- Escape close overlays
