import "server-only";

import { getOpenAiApiKey } from "@/lib/ai/env";

export function isTtsConfigured() {
  const provider = process.env.TTS_PROVIDER?.trim().toLowerCase();
  if (!provider) return false;
  if (provider === "openai") return Boolean(getOpenAiApiKey());
  return Boolean(process.env.TTS_API_KEY?.trim());
}

export function ttsUnavailableMessage() {
  return "Ovozli javob xizmati hali sozlanmagan.";
}

export const TTS_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;

export function resolveTtsVoice(id: string | undefined) {
  return (TTS_VOICES as readonly string[]).includes(id ?? "") ? id! : "alloy";
}

export function clampSpeed(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1.5, Math.max(0.75, value));
}
