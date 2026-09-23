import { getAppSession, unauthorizedJson } from "@/lib/auth/app-session";
import { listTaskSteps, saveTask } from "@/lib/tasks/store";
import { toClientTask } from "@/lib/tasks/run";
import { ownedStatus } from "@/lib/projects/access";
import { limitRoute } from "@/lib/security/rate-limit";
import { isTaskStatus } from "@/lib/tasks/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const limited = limitRoute(request, "tasks");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  const { id } = await context.params;
  const loaded = await listTaskSteps(session.supabase, session.identity.id, id);
  if (!loaded.ok) {
    const { status, code } = ownedStatus(loaded);
    return Response.json({ error: loaded.forbidden ? "Ruxsat yo'q." : "Vazifa topilmadi.", code }, { status });
  }
  return Response.json({ task: toClientTask(loaded.row, loaded.steps) });
}

export async function PATCH(request: Request, context: Ctx) {
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const { id } = await context.params;
  const loaded = await listTaskSteps(session.supabase, session.identity.id, id);
  if (!loaded.ok) {
    const { status, code } = ownedStatus(loaded);
    return Response.json({ error: "Vazifa topilmadi.", code }, { status });
  }
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  if (body.status !== "paused" && body.status !== "cancelled") {
    return Response.json({ error: "Faqat pauza yoki bekor qilish mumkin." }, { status: 400 });
  }
  if (loaded.row.status === "completed") {
    return Response.json({ error: "Yakunlangan vazifani o'zgartirib bo'lmaydi." }, { status: 400 });
  }
  if (!isTaskStatus(body.status)) return Response.json({ error: "Noto'g'ri holat." }, { status: 400 });
  const saved = await saveTask(session.supabase, session.identity.id, id, { status: body.status });
  if (!saved.ok) return Response.json({ error: "Vazifa topilmadi." }, { status: 404 });
  return Response.json({ task: toClientTask(saved.row, loaded.steps) });
}
