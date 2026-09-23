import "server-only";

import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isAdminIdentity } from "@/lib/admin/role";

export { isAdminIdentity } from "@/lib/admin/role";

export async function requireAdmin(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) {
    return { ok: false as const, status: 401 as const, error: "Davom etish uchun tizimga kiring." };
  }
  if (identity.suspended) {
    return { ok: false as const, status: 403 as const, error: "Hisob to'xtatilgan." };
  }
  if (!isAdminIdentity(identity)) {
    return { ok: false as const, status: 403 as const, error: "Admin huquqi yo'q." };
  }
  const supabase = isSupabaseConfigured() ? (await requireUser()).supabase : null;
  return { ok: true as const, identity, supabase };
}
