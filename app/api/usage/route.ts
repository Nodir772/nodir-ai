import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getUsageDashboard } from "@/lib/usage/track";

export async function GET(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  const supabase = isSupabaseConfigured() ? (await requireUser()).supabase : null;
  const usage = await getUsageDashboard(request, supabase);
  return Response.json({ usage });
}
