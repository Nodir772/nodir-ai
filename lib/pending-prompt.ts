import type { PendingPrompt } from "@/types";

export const PENDING_PROMPT_KEY = "nodir-ai:pending-prompt";

export function storePendingPrompt(text: string) {
  if (typeof window === "undefined") return;
  const payload: PendingPrompt = {
    text,
    createdAt: new Date().toISOString(),
  };
  sessionStorage.setItem(PENDING_PROMPT_KEY, JSON.stringify(payload));
}

export function readPendingPrompt(): PendingPrompt | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_PROMPT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingPrompt;
  } catch {
    return null;
  }
}

export function consumePendingPrompt(): PendingPrompt | null {
  const value = readPendingPrompt();
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(PENDING_PROMPT_KEY);
  }
  return value;
}
