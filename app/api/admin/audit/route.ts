import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/billing/flags";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  const db = createServiceClient();
  if (!db) return Response.json({ logs: [] });
  const { data } = await db.from("audit_logs").select("id, admin_user_id, action, target_user_id, metadata, created_at").order("created_at", { ascending: false }).limit(200);
  return Response.json({ logs: data ?? [] });
}
