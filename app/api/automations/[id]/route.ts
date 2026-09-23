import { getAppSession, unauthorizedJson } from "@/lib/auth/app-session";
import { deleteAutomation, getAutomation, updateAutomation } from "@/lib/automations/store";
import { SCHEDULE_NOTICE, validateSchedule } from "@/lib/automations/schedule";
import { ownedStatus } from "@/lib/projects/access";
import { limitRoute } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const { id } = await context.params;
  const owned = await getAutomation(session.supabase, session.identity.id, id);
  if (!owned.ok) {
    const { status, code } = ownedStatus(owned);
    return Response.json({ error: "Avtomatlashtirish topilmadi.", code }, { status });
  }
  return Response.json({ automation: owned.row, notice: SCHEDULE_NOTICE });
}

export async function PATCH(request: Request, context: Ctx) {
  const limited = limitRoute(request, "automations");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    prompt?: string;
    enabled?: boolean;
    scheduleEnabled?: boolean;
    scheduleType?: string;
    scheduleValue?: string;
    nextRunAt?: string | null;
  };
  if (body.scheduleType || body.scheduleValue || body.nextRunAt) {
    const schedule = validateSchedule(body);
    if (!schedule.ok) return Response.json({ error: schedule.error }, { status: 400 });
  }
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name || name.length > 80) return Response.json({ error: "Nom 1–80 belgi bo'lishi kerak." }, { status: 400 });
    patch.name = name;
  }
  if (typeof body.prompt === "string") patch.prompt = body.prompt.trim().slice(0, 8_000);
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
  if (typeof body.scheduleEnabled === "boolean") patch.scheduleEnabled = body.scheduleEnabled;
  if (typeof body.scheduleType === "string") patch.scheduleType = body.scheduleType;
  if (typeof body.scheduleValue === "string") patch.scheduleValue = body.scheduleValue;
  if (body.nextRunAt !== undefined) patch.nextRunAt = body.nextRunAt;
  const updated = await updateAutomation(session.supabase, session.identity.id, id, patch);
  if (!updated.ok) {
    const { status, code } = ownedStatus(updated);
    return Response.json({ error: "Avtomatlashtirish topilmadi.", code }, { status });
  }
  return Response.json({ automation: updated.row, notice: SCHEDULE_NOTICE });
}

export async function DELETE(request: Request, context: Ctx) {
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const { id } = await context.params;
  const deleted = await deleteAutomation(session.supabase, session.identity.id, id);
  if (!deleted.ok) {
    const { status, code } = ownedStatus(deleted);
    return Response.json({ error: "Avtomatlashtirish topilmadi.", code }, { status });
  }
  return Response.json({ ok: true });
}
