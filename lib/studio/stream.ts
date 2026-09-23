"use client";

async function readSse(response: Response, onDelta: (text: string) => void) {
  const { createSseDecoder, parseStreamEvent } = await import("@/lib/ai/streaming");
  const { handleLimitResponse } = await import("@/components/workspace/LimitModal");
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    const json = (await response.json()) as { error?: string; code?: string };
    handleLimitResponse(json);
    throw new Error(json.error ?? "Xizmatda vaqtinchalik muammo yuz berdi.");
  }
  if (!response.body) throw new Error("Xizmatda vaqtinchalik muammo yuz berdi.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const sse = createSseDecoder();
  let produced = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    for (const piece of sse.push(decoder.decode(value, { stream: true }))) {
      const event = parseStreamEvent(piece);
      if (!event) continue;
      if (event.type === "delta") {
        produced += event.text;
        onDelta(produced);
      } else if (event.type === "error") {
        throw new Error(event.message);
      }
    }
  }
  if (!produced.trim()) throw new Error("AI javob qaytarmadi.");
  return produced;
}

export async function streamStudio(body: Record<string, unknown>, onDelta: (text: string) => void) {
  const response = await fetch("/api/studio/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, stream: true }),
  });
  return readSse(response, onDelta);
}
