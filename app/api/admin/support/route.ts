import { requireAdmin } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { createServiceClient } from "@/lib/billing/flags";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  const db = createServiceClient();
  if (!db) return Response.json({ tickets: [] });
  const { data } = await db
    .from("support_tickets")
    .select("id, user_id, subject, category, message, status, admin_reply, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  return Response.json({ tickets: data ?? [] });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  const db = createServiceClient();
  if (!db) return Response.json({ error: "Service role kerak." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { id?: string; status?: string; reply?: string };
  if (!body.id) return Response.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
  const patch: Record<string, string> = {};
  if (body.status === "open" || body.status === "pending" || body.status === "resolved") patch.status = body.status;
  if (typeof body.reply === "string") patch.admin_reply = body.reply.slice(0, 4000);
  const { error } = await db.from("support_tickets").update(patch).eq("id", body.id);
  if (error) return Response.json({ error: "Yangilab bo'lmadi." }, { status: 500 });
  await writeAuditLog({ adminUserId: admin.identity.id, action: "support_update", metadata: { id: body.id, ...patch } });
  return Response.json({ ok: true });
}
