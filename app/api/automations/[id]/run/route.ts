import { getAppSession, unauthorizedJson } from "@/lib/auth/app-session";
import { requireAgent } from "@/lib/agents/guard";
import { getAutomation, updateAutomation } from "@/lib/automations/store";
import { computeNextRunAt, SCHEDULE_NOTICE } from "@/lib/automations/schedule";
import { assertTaskQuota } from "@/lib/agents/limits";
import { agentLimitsFor } from "@/lib/billing/plans";
import { countTasksSince, createTask } from "@/lib/tasks/store";
import { executeStoredTask, toClientTask } from "@/lib/tasks/run";
import { kindFromAgentId } from "@/lib/tasks/steps";
import { billingPeriod } from "@/lib/usage/period";
import { ownedStatus } from "@/lib/projects/access";
import { limitRoute } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const limited = limitRoute(request, "automations");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const { id } = await context.params;
  const owned = await getAutomation(session.supabase, session.identity.id, id);
  if (!owned.ok) {
    const { status, code } = ownedStatus(owned);
    return Response.json({ error: "Avtomatlashtirish topilmadi.", code }, { status });
  }
  if (!owned.row.enabled) {
    return Response.json({ error: "Avtomatlashtirish o'chirilgan." }, { status: 400 });
  }
  const resolved = await requireAgent(session, owned.row.agentId, true);
  if (!resolved.ok) return resolved.response;

  const period = billingPeriod();
  const used = await countTasksSince(session.supabase, session.identity.id, period.start.toISOString());
  const quota = assertTaskQuota(session.identity.plan, used);
  if (!quota.ok) {
    return Response.json({ error: quota.error, code: quota.code }, { status: quota.status });
  }

  const limits = agentLimitsFor(session.identity.plan);
  const created = await createTask(session.supabase, session.identity.id, {
    agentId: owned.row.agentId,
    projectId: owned.row.projectId,
    title: owned.row.name,
    prompt: owned.row.prompt,
    kind: kindFromAgentId(owned.row.agentId),
    maxSteps: limits.maxStepsPerTask,
  });
  const result = await executeStoredTask({
    request,
    identity: session.identity,
    supabase: session.supabase,
    taskId: created.task.id,
    agent: resolved.agent,
  });
  const status = result.ok ? result.task.status : "failed";
  const nextRunAt = owned.row.scheduleEnabled
    ? computeNextRunAt(owned.row.scheduleType, owned.row.scheduleValue)
    : owned.row.nextRunAt;
  await updateAutomation(session.supabase, session.identity.id, id, {
    lastRunAt: new Date().toISOString(),
    lastStatus: status,
    nextRunAt,
  });
  if (!result.ok) {
    return Response.json({ error: "Vazifa bajarilmadi.", notice: SCHEDULE_NOTICE }, { status: 500 });
  }
  return Response.json({
    automation: owned.row,
    task: toClientTask(result.task, result.steps),
    notice: SCHEDULE_NOTICE,
  });
}
