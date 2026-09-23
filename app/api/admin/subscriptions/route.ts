import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/billing/flags";
import { PLAN_IDS, resolvePlanId } from "@/lib/billing/plans";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  const db = createServiceClient();
  if (!db) return Response.json({ subscriptions: [], totals: emptyTotals() });
  const [{ data }, { data: all }] = await Promise.all([
    db
      .from("subscriptions")
      .select("user_id, plan, status, current_period_end, cancel_at_period_end, provider, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200),
    db.from("subscriptions").select("plan, status"),
  ]);
  const rows = (all ?? []) as { plan: string; status: string }[];
  const plans = { free: 0, pro: 0, pro_plus: 0, pro_max: 0 };
  const status = { active: 0, canceled: 0, past_due: 0, trialing: 0, other: 0 };
  for (const row of rows) {
    plans[resolvePlanId(row.plan)] += 1;
    if (row.status === "active") status.active += 1;
    else if (row.status === "canceled") status.canceled += 1;
    else if (row.status === "past_due") status.past_due += 1;
    else if (row.status === "trialing") status.trialing += 1;
    else status.other += 1;
  }
  return Response.json({
    subscriptions: data ?? [],
    totals: { plans, status, total: rows.length, planIds: PLAN_IDS },
  });
}

function emptyTotals() {
  return {
    plans: { free: 0, pro: 0, pro_plus: 0, pro_max: 0 },
    status: { active: 0, canceled: 0, past_due: 0, trialing: 0, other: 0 },
    total: 0,
  };
}
