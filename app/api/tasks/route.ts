import { getAppSession, unauthorizedJson } from "@/lib/auth/app-session";
import { requireAgent } from "@/lib/agents/guard";
import { assertTaskQuota } from "@/lib/agents/limits";
import { agentLimitsFor } from "@/lib/billing/plans";
import { countTasksSince, createTask, listTasks } from "@/lib/tasks/store";
import { kindFromAgentId } from "@/lib/tasks/steps";
import { isTaskKind, isTaskStatus } from "@/lib/tasks/types";
import { toClientTask } from "@/lib/tasks/run";
import { getProject } from "@/lib/db/projects";
import { billingPeriod } from "@/lib/usage/period";
import { limitRoute } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limited = limitRoute(request, "tasks");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const status = url.searchParams.get("status");
  const history = url.searchParams.get("history") === "1";
  try {
    if (projectId && session.supabase) {
      const project = await getProject(session.supabase, session.identity.id, projectId);
      if (!project.ok) {
        return Response.json({ error: "Loyiha topilmadi." }, { status: project.forbidden ? 403 : 404 });
      }
    }
    const tasks = await listTasks(session.supabase, session.identity.id, {
      projectId,
      status: status && isTaskStatus(status) ? status : undefined,
      history,
    });
    return Response.json({
      tasks: tasks.map((task) => toClientTask(task, [])),
    });
  } catch {
    return Response.json({ error: "Ma'lumotlarni yuklashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const limited = limitRoute(request, "tasks");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const body = (await request.json().catch(() => ({}))) as {
    agentId?: string;
    projectId?: string | null;
    title?: string;
    prompt?: string;
    kind?: string;
  };
  const agentId = body.agentId?.trim() ?? "";
  const prompt = body.prompt?.trim() ?? "";
  if (!agentId || !prompt) {
    return Response.json({ error: "Agent va vazifa matni kerak.", code: "INVALID_INPUT" }, { status: 400 });
  }
  const resolved = await requireAgent(session, agentId, true);
  if (!resolved.ok) return resolved.response;

  if (body.projectId && session.supabase) {
    const project = await getProject(session.supabase, session.identity.id, body.projectId);
    if (!project.ok) {
      return Response.json({ error: "Loyiha topilmadi." }, { status: project.forbidden ? 403 : 404 });
    }
  }

  const period = billingPeriod();
  const used = await countTasksSince(session.supabase, session.identity.id, period.start.toISOString());
  const quota = assertTaskQuota(session.identity.plan, used);
  if (!quota.ok) {
    return Response.json({ error: quota.error, code: quota.code, limit: quota.limit }, { status: quota.status });
  }

  const kind = body.kind && isTaskKind(body.kind) ? body.kind : kindFromAgentId(agentId);
  const limits = agentLimitsFor(session.identity.plan);
  const created = await createTask(session.supabase, session.identity.id, {
    agentId,
    projectId: body.projectId ?? null,
    title: (body.title?.trim() || prompt).slice(0, 120),
    prompt,
    kind,
    maxSteps: limits.maxStepsPerTask,
  });
  return Response.json({ task: toClientTask(created.task, created.steps) });
}
