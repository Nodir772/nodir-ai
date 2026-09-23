import "server-only";

import { createServiceClient } from "@/lib/billing/flags";

export async function writeAuditLog(input: {
  adminUserId: string;
  action: string;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createServiceClient();
  if (!admin) return;
  const safe = { ...input.metadata };
  delete safe.password;
  delete safe.apiKey;
  delete safe.secret;
  await admin.from("audit_logs").insert({
    admin_user_id: input.adminUserId,
    action: input.action,
    target_user_id: input.targetUserId ?? null,
    metadata: safe,
  });
}
