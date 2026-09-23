import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/billing/flags";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  const db = createServiceClient();
  if (!db) return Response.json({ usage: [] });
  const { data } = await db
    .from("tool_usage")
    .select("user_id, tool, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  return Response.json({ usage: data ?? [] });
}
