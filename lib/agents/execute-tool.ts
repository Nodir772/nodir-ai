import "server-only";

import { completeAiText, requestTimeoutSignal } from "@/lib/ai/complete";
import { getOpenAIClient } from "@/lib/ai/client";
import { isOpenAiConfigured } from "@/lib/ai/config";
import { USER_ERRORS } from "@/lib/ai/errors";
import { agentAllowsTool, getAgentTool } from "@/lib/agents/tools";
import type { AgentDefinition, AgentToolId } from "@/lib/agents/types";
import { composeAgentSystem } from "@/lib/agents/compose";
import type { RequestIdentity } from "@/lib/auth/request-user";
import { assertFeature, entitlementJson } from "@/lib/billing/entitlements";
import { wrapUntrustedData } from "@/lib/search/untrusted";
import { searchWeb } from "@/lib/search";
import { assertUsage, recordUsage, usageLimitJson } from "@/lib/usage/track";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ToolExecutionOk = {
  ok: true;
  text: string;
  sources?: { title: string; url: string; snippet: string }[];
  files?: { id: string; filename: string }[];
  usageTool: ReturnType<typeof getAgentTool>["usageTool"];
};

export type ToolExecutionErr = {
  ok: false;
  response: Response;
};

export async function executeAgentTool(options: {
  request: Request;
  identity: RequestIdentity;
  agent: AgentDefinition;
  tool: AgentToolId;
  input: string;
  supabase: SupabaseClient | null;
  extraSystem?: string;
}): Promise<ToolExecutionOk | ToolExecutionErr> {
  if (!agentAllowsTool(options.agent.allowedTools, options.tool)) {
    return {
      ok: false,
      response: Response.json(
        { error: "Bu vosita ushbu agentda yoqilmagan.", code: "TOOL_NOT_ALLOWED" },
        { status: 403 },
      ),
    };
  }

  const tool = getAgentTool(options.tool);
  const gate = await assertFeature(options.identity, tool.feature);
  if (!gate.ok) return { ok: false, response: entitlementJson(gate) };

  const usage = await assertUsage(options.request, tool.usageTool, options.supabase);
  if (!usage.ok) {
    if (usage.code === "USAGE_LIMIT" && "limit" in usage) {
      return { ok: false, response: usageLimitJson(usage) };
    }
    return {
      ok: false,
      response: Response.json({ error: usage.error, code: usage.code }, { status: usage.status }),
    };
  }

  const text = options.input.trim().slice(0, 12_000);
  if (!text) {
    return { ok: false, response: Response.json({ error: "Matn bo'sh bo'lmasligi kerak.", code: "INVALID_INPUT" }, { status: 400 }) };
  }

  if (options.tool === "web_search") {
    const search = await searchWeb(text);
    await recordUsage(options.request, "search", options.supabase);
    if (!search.ok) {
      return {
        ok: true,
        text: search.error ?? "Qidiruv natija bermadi.",
        sources: [],
        usageTool: "search",
      };
    }
    const digest = search.results.map((hit) => `${hit.title}\n${hit.url}\n${hit.snippet}`).join("\n\n");
    return {
      ok: true,
      text: wrapUntrustedData("WEB_SEARCH", digest || "Natija yo'q."),
      sources: search.results.map((hit) => ({ title: hit.title, url: hit.url, snippet: hit.snippet })),
      usageTool: "search",
    };
  }

  if (options.tool === "documents") {
    const files: { id: string; filename: string }[] = [];
    let excerpts = "";
    if (options.supabase) {
      const { data } = await options.supabase
        .from("documents")
        .select("id, filename, extracted_text")
        .eq("user_id", options.identity.id)
        .order("created_at", { ascending: false })
        .limit(6);
      for (const doc of data ?? []) {
        files.push({ id: String(doc.id), filename: String(doc.filename ?? "fayl") });
        const body = String(doc.extracted_text ?? "").trim();
        if (body) excerpts += `\n\n[${doc.filename}]\n${body.slice(0, 3_000)}`;
      }
    }
    await recordUsage(options.request, "documents", options.supabase);
    return {
      ok: true,
      text: wrapUntrustedData("DOCUMENTS", excerpts.trim() || "Hujjat topilmadi."),
      files,
      usageTool: "documents",
    };
  }

  if (options.tool === "image") {
    if (!isOpenAiConfigured()) {
      return {
        ok: false,
        response: Response.json({ error: USER_ERRORS.missingKey, code: "MISSING_API_KEY" }, { status: 503 }),
      };
    }
    const client = getOpenAIClient();
    if (!client) {
      return {
        ok: false,
        response: Response.json({ error: USER_ERRORS.missingKey, code: "MISSING_API_KEY" }, { status: 503 }),
      };
    }
    try {
      const model = process.env.OPENAI_IMAGE_MODEL?.trim() || "dall-e-3";
      const result = await client.images.generate({
        model,
        prompt: text.slice(0, 3_000),
        size: "1024x1024",
        n: 1,
        response_format: "b64_json",
      });
      if (!result.data?.[0]?.b64_json) {
        return {
          ok: false,
          response: Response.json({ error: "Rasm yaratilmadi.", code: "EMPTY_IMAGE" }, { status: 502 }),
        };
      }
      await recordUsage(options.request, "image", options.supabase);
      return {
        ok: true,
        text: "Rasm yaratildi. Piksel ma'lumotlari vazifa natijasida saqlanmaydi — Image studio orqali ko'ring.",
        usageTool: "image",
      };
    } catch {
      return {
        ok: false,
        response: Response.json({ error: "Rasm xizmatida xatolik yuz berdi.", code: "PROVIDER_ERROR" }, { status: 502 }),
      };
    }
  }

  const system = composeAgentSystem({
    catalogInstructions: options.agent.instructions,
    extras: [tool.systemAddon, options.extraSystem],
  });
  const completed = await completeAiText(
    [{ role: "user", content: text }],
    system,
    options.agent.model,
    requestTimeoutSignal(options.request),
  );
  if (!completed.ok) {
    return {
      ok: false,
      response: Response.json({ error: completed.error, code: completed.code }, { status: completed.status }),
    };
  }
  await recordUsage(options.request, tool.usageTool, options.supabase);
  return { ok: true, text: completed.text, usageTool: tool.usageTool };
}
