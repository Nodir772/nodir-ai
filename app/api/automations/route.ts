import { getAppSession, unauthorizedJson } from "@/lib/auth/app-session";
import { requireAgent } from "@/lib/agents/guard";
import { assertAutomationQuota } from "@/lib/agents/limits";
import { createAutomation, listAutomations } from "@/lib/automations/store";
import { SCHEDULE_NOTICE, validateSchedule } from "@/lib/automations/schedule";
import { getProject } from "@/lib/db/projects";
import { limitRoute } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limited = limitRoute(request, "automations");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  try {
    const automations = await listAutomations(session.supabase, session.identity.id);
    return Response.json({ automations, notice: SCHEDULE_NOTICE });
  } catch {
    return Response.json({ error: "Ma'lumotlarni yuklashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const limited = limitRoute(request, "automations");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const body = (await request.json().catch(() => ({}))) as {
    agentId?: string;
    projectId?: string | null;
    name?: string;
    prompt?: string;
    enabled?: boolean;
    scheduleEnabled?: boolean;
    scheduleType?: string;
    scheduleValue?: string;
    nextRunAt?: string | null;
  };
  const name = body.name?.trim() ?? "";
  const prompt = body.prompt?.trim() ?? "";
  const agentId = body.agentId?.trim() ?? "";
  if (!name || name.length > 80 || !prompt || !agentId) {
    return Response.json({ error: "Nom, agent va matn kerak.", code: "INVALID_INPUT" }, { status: 400 });
  }
  const resolved = await requireAgent(session, agentId, true);
  if (!resolved.ok) return resolved.response;
  const schedule = validateSchedule(body);
  if (!schedule.ok) return Response.json({ error: schedule.error, code: "INVALID_INPUT" }, { status: 400 });
  if (body.projectId && session.supabase) {
    const project = await getProject(session.supabase, session.identity.id, body.projectId);
    if (!project.ok) return Response.json({ error: "Loyiha topilmadi." }, { status: project.forbidden ? 403 : 404 });
  }
  const existing = await listAutomations(session.supabase, session.identity.id);
  const quota = assertAutomationQuota(session.identity.plan, existing.length);
  if (!quota.ok) return Response.json({ error: quota.error, code: quota.code }, { status: quota.status });

  const row = await createAutomation(session.supabase, session.identity.id, {
    agentId,
    projectId: body.projectId ?? null,
    name,
    prompt,
    enabled: body.enabled,
    scheduleEnabled: body.scheduleEnabled,
    scheduleType: schedule.scheduleType,
    scheduleValue: schedule.scheduleValue,
    nextRunAt: body.nextRunAt,
  });
  return Response.json({ automation: row, notice: SCHEDULE_NOTICE });
}
