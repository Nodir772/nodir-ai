import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/billing/flags";
import { resolvePlanId } from "@/lib/billing/plans";

function emptyTotals() {
  return { users: 0, free: 0, pro: 0, pro_plus: 0, pro_max: 0, chat: 0, image: 0, documents: 0 };
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  const db = createServiceClient();
  if (!db) {
    return Response.json({
      totals: emptyTotals(),
      notice: "Admin statistikasi uchun SUPABASE_SERVICE_ROLE_KEY kerak.",
    });
  }
  const [{ count: users }, { data: plans }, { count: chat }, { count: image }, { count: documents }] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("profiles").select("plan"),
    db.from("tool_usage").select("id", { count: "exact", head: true }).eq("tool", "chat"),
    db.from("tool_usage").select("id", { count: "exact", head: true }).eq("tool", "image"),
    db.from("tool_usage").select("id", { count: "exact", head: true }).eq("tool", "documents"),
  ]);
  const rows = (plans ?? []) as { plan: string }[];
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const { count: newUsers } = await db
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", start.toISOString());
  const { count: active } = await db
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("last_seen_at", start.toISOString());

  const counted = { free: 0, pro: 0, pro_plus: 0, pro_max: 0 };
  for (const row of rows) {
    counted[resolvePlanId(row.plan)] += 1;
  }

  return Response.json({
    totals: {
      users: users ?? 0,
      newUsers: newUsers ?? 0,
      activeUsers: active ?? 0,
      ...counted,
      chat: chat ?? 0,
      image: image ?? 0,
      documents: documents ?? 0,
    },
  });
}
