import "server-only";

import { getOpenAiApiKey, isOpenAiApiKeyPlausible } from "@/lib/ai/env";

/** True only when OPENAI_API_KEY looks like a real OpenAI secret, not a placeholder. */
export function isOpenAIConfigured() {
  return isOpenAiApiKeyPlausible();
}

/** Server-only. Never log the return value. Never read NEXT_PUBLIC_OPENAI_API_KEY. */
export function readOpenAiApiKey() {
  return getOpenAiApiKey();
}
