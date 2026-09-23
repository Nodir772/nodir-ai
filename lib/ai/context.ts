import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { AIMessage } from "@/lib/ai/types";
import { CONTEXT_LIMITS } from "@/lib/ai/config";

export type ContextBuildResult = {
  messages: AIMessage[];
  trimmed: boolean;
};

export function composeSystemAddons(parts: Array<string | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join("\n\n");
}

export function buildModelContext(
  history: AIMessage[],
  extraSystem?: string,
  limits: { maxMessages: number; maxRequestChars: number } = CONTEXT_LIMITS,
): ContextBuildResult {
  const withoutSystem = history.filter((message) => message.role !== "system");
  let selected = withoutSystem.slice(-limits.maxMessages);
  let trimmed = selected.length < withoutSystem.length;

  let total = selected.reduce((sum, message) => sum + message.content.length, 0);
  while (selected.length > 2 && total > limits.maxRequestChars) {
    selected = selected.slice(1);
    trimmed = true;
    total = selected.reduce((sum, message) => sum + message.content.length, 0);
  }

  if (selected[0]?.role === "assistant") {
    selected = selected.slice(1);
    trimmed = true;
  }

  const system = extraSystem?.trim() ? `${SYSTEM_PROMPT}\n\n${extraSystem.trim()}` : SYSTEM_PROMPT;

  return {
    trimmed,
    messages: [{ role: "system", content: system }, ...selected],
  };
}

export function summarizeOlderMessages(messages: AIMessage[]): AIMessage | null {
  void messages;
  return null;
}
