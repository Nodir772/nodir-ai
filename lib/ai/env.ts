function sanitizeKey(raw: string | undefined | null) {
  if (!raw) return "";
  return raw
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

/**
 * Server-only. Next.js copies `.env.local` into `process.env` when the Node
 * process starts — restart `npm run dev` after changing OPENAI_API_KEY.
 * Never log the returned value. Never read NEXT_PUBLIC_OPENAI_API_KEY.
 */
export function getOpenAiApiKey() {
  return sanitizeKey(process.env.OPENAI_API_KEY);
}

export function isOpenAiApiKeyPresent() {
  return Boolean(getOpenAiApiKey());
}

/** Present is not the same as usable. Placeholders like "sk-..." are too short. */
export function isOpenAiApiKeyPlausible() {
  const key = getOpenAiApiKey();
  return key.startsWith("sk-") && key.length >= 20;
}

/** Test helper. Does not read env files or public keys. */
export function sanitizeOpenAiApiKeyForTests(raw: string | undefined | null) {
  return sanitizeKey(raw);
}
