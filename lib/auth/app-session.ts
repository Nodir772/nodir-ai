import { getRequestIdentity, type RequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AppSession = {
  identity: RequestIdentity;
  supabase: SupabaseClient | null;
};

export async function getAppSession(request: Request): Promise<AppSession | null> {
  const identity = await getRequestIdentity(request);
  if (!identity) return null;
  if (!isSupabaseConfigured()) return { identity, supabase: null };
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return null;
  return { identity: { ...identity, id: user.id }, supabase };
}

export function unauthorizedJson() {
  return Response.json({ error: "Davom etish uchun tizimga kiring.", code: "UNAUTHORIZED" }, { status: 401 });
}
