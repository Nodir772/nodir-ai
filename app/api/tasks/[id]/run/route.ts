import { getAppSession, unauthorizedJson } from "@/lib/auth/app-session";
import { requireAgent } from "@/lib/agents/guard";
import { executeStoredTask, toClientTask } from "@/lib/tasks/run";
import { getTask } from "@/lib/tasks/store";
import { ownedStatus } from "@/lib/projects/access";
import { limitRoute } from "@/lib/security/rate-limit";
import { createNotification } from "@/lib/db/notifications";

export const runtime = "nodejs";
export const maxDuration = 60;

async function run(request: Request, id: string, retry: boolean) {
  const limited = limitRoute(request, "tasks");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const owned = await getTask(session.supabase, session.identity.id, id);
  if (!owned.ok) {
    const { status, code } = ownedStatus(owned);
    return Response.json({ error: "Vazifa topilmadi.", code }, { status });
  }
  const resolved = await requireAgent(session, owned.row.agentId, true);
  if (!resolved.ok) return resolved.response;
  const result = await executeStoredTask({
    request,
    identity: session.identity,
    supabase: session.supabase,
    taskId: id,
    agent: resolved.agent,
    retry,
  });
  if (!result.ok) {
    const { status, code } = ownedStatus(result);
    return Response.json({ error: "Vazifa topilmadi.", code }, { status });
  }
  if (session.supabase && (result.task.status === "completed" || result.task.status === "failed")) {
    try {
      await createNotification(session.supabase, session.identity.id, {
        category: result.task.status === "failed" ? "usage" : "ai",
        title: result.task.status === "failed" ? "Vazifa xato bilan tugadi" : "Vazifa yakunlandi",
        body: result.task.title.slice(0, 120),
      });
    } catch {
      /* optional */
    }
  }
  return Response.json({ task: toClientTask(result.task, result.steps) });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return run(request, id, false);
}
