import { getAppSession, unauthorizedJson } from "@/lib/auth/app-session";
import { requireAgent } from "@/lib/agents/guard";
import { prepareAgentChatContext } from "@/lib/agents/prepare-chat";
import { addAgentMessage, listAgentMessages } from "@/lib/agents/messages";
import { CONTEXT_LIMITS, isOpenAiConfigured, resolveProviderModel } from "@/lib/ai/config";
import { requestTimeoutSignal, streamAiResponse } from "@/lib/ai/complete";
import { USER_ERRORS } from "@/lib/ai/errors";
import type { AIMessage } from "@/lib/ai/types";
import { assertFeature, entitlementJson } from "@/lib/billing/entitlements";
import { assertUsage, recordUsage, usageLimitJson } from "@/lib/usage/track";
import { agentAllowsTool } from "@/lib/agents/tools";
import { limitRoute } from "@/lib/security/rate-limit";
import { createNotification } from "@/lib/db/notifications";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const { id } = await context.params;
  const resolved = await requireAgent(session, id, false);
  if (!resolved.ok) return resolved.response;
  const messages = await listAgentMessages(session.supabase, session.identity.id, id);
  return Response.json({ messages });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const limited = limitRoute(request, "agents");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const { id } = await context.params;
  const resolved = await requireAgent(session, id, true);
  if (!resolved.ok) return resolved.response;

  const usage = await assertUsage(request, "chat", session.supabase);
  if (!usage.ok) {
    if (usage.code === "USAGE_LIMIT" && "limit" in usage) return usageLimitJson(usage);
    return Response.json({ error: usage.error, code: usage.code }, { status: usage.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    content?: string;
    projectId?: string | null;
    webSearch?: boolean;
  };
  const content = body.content?.trim() ?? "";
  if (!content || content.length > CONTEXT_LIMITS.maxMessageChars) {
    return Response.json({ error: "Xabar bo'sh yoki haddan tashqari uzun.", code: "INVALID_INPUT" }, { status: 400 });
  }

  if (body.webSearch) {
    if (!agentAllowsTool(resolved.agent.allowedTools, "web_search")) {
      return Response.json({ error: "Bu agentda veb-qidiruv yoqilmagan.", code: "TOOL_NOT_ALLOWED" }, { status: 403 });
    }
    const searchGate = await assertFeature(session.identity, "web_search");
    if (!searchGate.ok) return entitlementJson(searchGate);
    const searchUsage = await assertUsage(request, "search", session.supabase);
    if (!searchUsage.ok) {
      if (searchUsage.code === "USAGE_LIMIT" && "limit" in searchUsage) return usageLimitJson(searchUsage);
      return Response.json({ error: searchUsage.error, code: searchUsage.code }, { status: searchUsage.status });
    }
  }

  if (!isOpenAiConfigured()) {
    return Response.json({ error: USER_ERRORS.missingKey, code: "MISSING_API_KEY" }, { status: 503 });
  }

  await addAgentMessage(session.supabase, session.identity.id, id, "user", content);
  const previous = await listAgentMessages(session.supabase, session.identity.id, id);
  const history: AIMessage[] = previous.map((item) => ({ role: item.role, content: item.content }));

  const prepared = await prepareAgentChatContext({
    agent: resolved.agent,
    history,
    userId: session.identity.id,
    supabase: session.supabase,
    projectId: body.projectId,
    webSearch: Boolean(body.webSearch && agentAllowsTool(resolved.agent.allowedTools, "web_search")),
  });

  if (body.webSearch) await recordUsage(request, "search", session.supabase);
  await recordUsage(request, "chat", session.supabase);

  const signal = requestTimeoutSignal(request);
  return streamAiResponse(history, resolveProviderModel(resolved.agent.model), prepared.extraSystem, signal, {
    ...prepared.meta,
    onComplete: async (text) => {
      await addAgentMessage(session.supabase, session.identity.id, id, "assistant", text);
      if (session.supabase) {
        try {
          await createNotification(session.supabase, session.identity.id, {
            category: "ai",
            title: "Agent javobi tayyor",
            body: resolved.agent.name,
          });
        } catch {
          /* optional */
        }
      }
    },
  });
}
