import { getAppSession, unauthorizedJson } from "@/lib/auth/app-session";
import { requireAgent, toClientAgent } from "@/lib/agents/guard";
import { createCustomAgent, listCustomAgents } from "@/lib/agents/store";
import { assertCustomAgentQuota } from "@/lib/agents/limits";
import { limitRoute } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const limited = limitRoute(request, "agents");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const { id } = await context.params;
  const resolved = await requireAgent(session, id, true);
  if (!resolved.ok) return resolved.response;

  const existing = await listCustomAgents(session.supabase, session.identity.id);
  const quota = assertCustomAgentQuota(session.identity.plan, existing.length);
  if (!quota.ok) {
    return Response.json({ error: quota.error, code: quota.code }, { status: quota.status });
  }

  const copy = await createCustomAgent(session.supabase, session.identity.id, {
    name: `${resolved.agent.name} (nusxa)`,
    description: resolved.agent.description,
    icon: resolved.agent.icon,
    instructions: resolved.agent.instructions,
    allowedTools: resolved.agent.allowedTools,
    model: resolved.agent.model,
  });
  return Response.json({ agent: toClientAgent(copy, session.identity.plan) });
}
