import type { StreamEvent } from "@/lib/ai/types";

export function encodeSse(event: StreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function createSseDecoder() {
  let buffer = "";

  return {
    push(chunk: string) {
      buffer += chunk;
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      return parts
        .map((part) => part.replace(/^data:\s*/, "").trim())
        .filter(Boolean);
    },
  };
}

export function parseStreamEvent(raw: string): StreamEvent | null {
  try {
    const parsed = JSON.parse(raw) as StreamEvent;
    if (!parsed || typeof parsed !== "object" || !("type" in parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}
