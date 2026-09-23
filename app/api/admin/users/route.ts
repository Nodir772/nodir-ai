import { requireAdmin } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { createServiceClient } from "@/lib/billing/flags";
import { resolvePlanId } from "@/lib/billing/plans";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  const db = createServiceClient();
  if (!db) return Response.json({ users: [], notice: "Service role kerak." });
  const { data, error } = await db
    .from("profiles")
    .select("id, name, email, plan, role, is_suspended, last_seen_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return Response.json({ error: "Foydalanuvchilarni yuklab bo'lmadi." }, { status: 500 });
  return Response.json({ users: data ?? [] });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  const db = createServiceClient();
  if (!db) return Response.json({ error: "Service role kerak." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as {
    userId?: string;
    plan?: string;
    suspended?: boolean;
    role?: string;
  };
  if (!body.userId) return Response.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (body.plan) patch.plan = resolvePlanId(body.plan);
  if (typeof body.suspended === "boolean") patch.is_suspended = body.suspended;
  if (body.role === "user" || body.role === "admin") patch.role = body.role;
  const { error } = await db.from("profiles").update(patch).eq("id", body.userId);
  if (error) return Response.json({ error: "Yangilab bo'lmadi." }, { status: 500 });
  await writeAuditLog({
    adminUserId: admin.identity.id,
    action: body.suspended ? "suspend" : body.plan ? "plan_change" : "access_change",
    targetUserId: body.userId,
    metadata: patch,
  });
  return Response.json({ ok: true });
}
