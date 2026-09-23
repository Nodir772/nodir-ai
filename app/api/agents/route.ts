import { getAppSession, unauthorizedJson } from "@/lib/auth/app-session";
import { BUILTIN_AGENTS } from "@/lib/agents/catalog";
import { createCustomAgent, listCustomAgents } from "@/lib/agents/store";
import { assertCustomAgentQuota } from "@/lib/agents/limits";
import { toClientAgent } from "@/lib/agents/guard";
import { isAgentIcon, isAgentToolId } from "@/lib/agents/types";
import { sanitizeAgentTools } from "@/lib/agents/tools";
import { isAllowedModelId } from "@/lib/ai/config";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import { listAutomations } from "@/lib/automations/store";
import { taskStats } from "@/lib/tasks/store";
import { limitRoute } from "@/lib/security/rate-limit";
import { getProject } from "@/lib/db/projects";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limited = limitRoute(request, "agents");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();

  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const wantStats = url.searchParams.get("stats") === "1";

  try {
    const custom = await listCustomAgents(session.supabase, session.identity.id);
    const favoriteIds = new Set<string>();
    if (session.supabase) {
      const { data } = await session.supabase
        .from("favorites")
        .select("item_id")
        .eq("user_id", session.identity.id)
        .eq("item_type", "agent");
      for (const row of data ?? []) favoriteIds.add(String(row.item_id));
    }

    const builtins = BUILTIN_AGENTS.map((agent) => toClientAgent(agent, session.identity.plan, favoriteIds.has(agent.id)));
    const customs = custom.map((agent) => toClientAgent(agent, session.identity.plan, favoriteIds.has(agent.id)));

    let agents = [...builtins, ...customs];
    if (filter === "builtin") agents = builtins;
    else if (filter === "custom" || filter === "mine") agents = customs;
    else if (filter === "favorites") agents = agents.filter((item) => item.favorite);

    let stats = undefined;
    if (wantStats) {
      const tasks = await taskStats(session.supabase, session.identity.id);
      const automations = await listAutomations(session.supabase, session.identity.id);
      stats = {
        activeAgents: customs.filter((item) => item.enabled).length + builtins.filter((item) => !item.locked).length,
        tasksRunning: tasks.running,
        tasksCompleted: tasks.completed,
        tasksFailed: tasks.failed,
        automationCount: automations.length,
      };
    }

    return Response.json({ agents, stats });
  } catch {
    return Response.json({ error: "Ma'lumotlarni yuklashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const limited = limitRoute(request, "agents");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    icon?: string;
    instructions?: string;
    allowedTools?: string[];
    model?: string;
    projectId?: string | null;
  };
  const name = body.name?.trim() ?? "";
  if (!name || name.length > 80) {
    return Response.json({ error: "Agent nomi 1–80 belgi oralig'ida bo'lishi kerak." }, { status: 400 });
  }

  try {
    const existing = await listCustomAgents(session.supabase, session.identity.id);
    const quota = assertCustomAgentQuota(session.identity.plan, existing.length);
    if (!quota.ok) {
      return Response.json({ error: quota.error, code: quota.code, requiredPlan: quota.requiredPlan }, { status: quota.status });
    }
    if (body.projectId && session.supabase) {
      const project = await getProject(session.supabase, session.identity.id, body.projectId);
      if (!project.ok) {
        return Response.json({ error: "Loyiha topilmadi.", code: "NOT_FOUND" }, { status: project.forbidden ? 403 : 404 });
      }
    }
    const tools = sanitizeAgentTools(body.allowedTools).filter(isAgentToolId);
    const agent = await createCustomAgent(session.supabase, session.identity.id, {
      name,
      description: (body.description ?? "").trim().slice(0, 500),
      icon: body.icon && isAgentIcon(body.icon) ? body.icon : "sparkles",
      instructions: (body.instructions ?? "").trim().slice(0, 8_000),
      allowedTools: tools,
      model: body.model && isAllowedModelId(body.model) ? body.model : DEFAULT_MODEL_ID,
      projectId: body.projectId ?? null,
    });
    return Response.json({ agent: toClientAgent(agent, session.identity.plan) });
  } catch {
    return Response.json({ error: "Ma'lumotlarni saqlashda xatolik yuz berdi." }, { status: 500 });
  }
}
