import { runStudioText } from "@/lib/ai/studio/run";
import { writingSystemAddon } from "@/lib/ai/studio/writing";
import { codeSystemAddon } from "@/lib/ai/studio/code";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const kind = typeof body.kind === "string" ? body.kind : "";
  const input = typeof body.input === "string" ? body.input : "";
  const model = typeof body.model === "string" ? body.model : undefined;
  const stream = body.stream !== false;

  if (kind === "writing") {
    const result = await runStudioText({
      request,
      feature: "writer",
      usageTool: "writer",
      model,
      input,
      stream,
      systemAddon: writingSystemAddon(
        String(body.tone ?? "professional"),
        String(body.action ?? "improve"),
        String(body.length ?? "medium"),
      ),
    });
    return result.response;
  }

  if (kind === "code") {
    const result = await runStudioText({
      request,
      feature: "code",
      usageTool: "code",
      model,
      input,
      stream,
      systemAddon: codeSystemAddon(String(body.language ?? "TypeScript"), String(body.action ?? "generate")),
    });
    return result.response;
  }

  if (kind === "research") {
    const result = await runStudioText({
      request,
      feature: "web_search",
      usageTool: "chat",
      model,
      input,
      stream,
      systemAddon:
        "You are Nodir AI Research Studio. Synthesize only from the provided sources. Never invent URLs or citations. If sources are missing, say so.",
    });
    return result.response;
  }

  if (kind === "translate") {
    const result = await runStudioText({
      request,
      feature: "translate",
      usageTool: "translate",
      model,
      input: `Translate from ${String(body.from ?? "auto")} to ${String(body.to ?? "uzbek")}. Preserve formatting.\n\n${input}`,
      stream,
      systemAddon: "You are Nodir AI Translation Studio. Translate accurately. Do not add commentary.",
    });
    return result.response;
  }

  if (kind === "summarize") {
    const result = await runStudioText({
      request,
      feature: "summarizer",
      usageTool: "summarizer",
      model,
      input: `Summary style: ${String(body.style ?? "balanced")}.\n\n${input}`,
      stream,
      systemAddon: "You are Nodir AI Summarizer. Stay within the given text. Do not invent facts.",
    });
    return result.response;
  }

  return Response.json({ error: "Noto'g'ri studio turi.", code: "INVALID_TOOL" }, { status: 400 });
}
