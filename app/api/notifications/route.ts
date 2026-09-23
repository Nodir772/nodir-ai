import { requirePersistence } from "@/lib/db/http";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/db/notifications";
import { limitRoute } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  const limited = limitRoute(request, "default");
  if (!limited.ok) {
    return Response.json({ error: "Juda ko'p so'rov yuborildi. Biroz kuting.", code: "RATE_LIMIT" }, { status: 429 });
  }
  if (!isSupabaseConfigured()) {
    return Response.json({ notifications: [], persistence: false });
  }
  const session = await requirePersistence();
  if (session.error) return session.error;
  try {
    const notifications = await listNotifications(session.supabase, session.user.id);
    return Response.json({ notifications });
  } catch {
    return Response.json({ error: "Ma'lumotlarni yuklashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const body = (await request.json().catch(() => ({}))) as { id?: string; all?: boolean };
  try {
    if (body.all) {
      await markAllNotificationsRead(session.supabase, session.user.id);
      return Response.json({ ok: true });
    }
    if (!body.id) return Response.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
    await markNotificationRead(session.supabase, session.user.id, body.id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Ma'lumotlarni saqlashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
  try {
    await deleteNotification(session.supabase, session.user.id, id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Ma'lumotlarni o'chirishda xatolik yuz berdi." }, { status: 500 });
  }
}
