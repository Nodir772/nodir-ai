import { getAppSession, unauthorizedJson } from "@/lib/auth/app-session";
import { saveTask, listTaskSteps } from "@/lib/tasks/store";
import { toClientTask } from "@/lib/tasks/run";
import { ownedStatus } from "@/lib/projects/access";
import { trackTaskEvent } from "@/lib/observability/monitor";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const { id } = await context.params;
  const loaded = await listTaskSteps(session.supabase, session.identity.id, id);
  if (!loaded.ok) {
    const { status, code } = ownedStatus(loaded);
    return Response.json({ error: "Vazifa topilmadi.", code }, { status });
  }
  if (loaded.row.status === "completed") {
    return Response.json({ error: "Yakunlangan vazifani bekor qilib bo'lmaydi." }, { status: 400 });
  }
  const saved = await saveTask(session.supabase, session.identity.id, id, { status: "cancelled" }, loaded.steps);
  if (!saved.ok) return Response.json({ error: "Vazifa topilmadi." }, { status: 404 });
  trackTaskEvent({
    status: "cancelled",
    durationMs: saved.row.durationMs ?? 0,
    retries: saved.row.retryCount,
    cancelled: true,
    failed: false,
    stepCount: loaded.steps.length,
    toolCalls: saved.row.toolCalls,
  });
  return Response.json({ task: toClientTask(saved.row, loaded.steps) });
}
