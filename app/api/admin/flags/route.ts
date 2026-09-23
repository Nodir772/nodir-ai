import { requireAdmin } from "@/lib/admin/auth";
import { listFlags, setFlag } from "@/lib/billing/flags";
import { FEATURE_FLAG_KEYS, type FeatureFlagKey } from "@/lib/billing/plans";
import { writeAuditLog } from "@/lib/admin/audit";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  return Response.json({ flags: await listFlags() });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  const body = (await request.json().catch(() => ({}))) as { key?: string; enabled?: boolean };
  if (!body.key || typeof body.enabled !== "boolean" || !(FEATURE_FLAG_KEYS as readonly string[]).includes(body.key)) {
    return Response.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
  }
  await setFlag(body.key as FeatureFlagKey, body.enabled);
  await writeAuditLog({
    adminUserId: admin.identity.id,
    action: "feature_flag",
    metadata: { key: body.key, enabled: body.enabled },
  });
  return Response.json({ ok: true, flags: await listFlags() });
}
