import { LOCAL_SESSION_COOKIE } from "@/lib/auth/constants";
import { requireUser } from "@/lib/db/auth";
import { getProfile } from "@/lib/db/profiles";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { resolvePlanId, type PlanId } from "@/lib/billing/plans";

export type RequestIdentity = {
  id: string;
  plan: PlanId;
  email?: string;
  role?: "user" | "admin";
  suspended?: boolean;
};

function parseLocalUser(request: Request): RequestIdentity | null {
  const header = request.headers.get("cookie") ?? "";
  const part = header.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${LOCAL_SESSION_COOKIE}=`));
  if (!part) return null;
  try {
    const raw = decodeURIComponent(part.slice(LOCAL_SESSION_COOKIE.length + 1));
    const parsed = JSON.parse(raw) as { id?: string; plan?: string; email?: string };
    if (!parsed.id) return null;
    const plan: PlanId = "pro_max";
    const emails = (process.env.ADMIN_EMAILS ?? "").split(",").map((item) => item.trim().toLowerCase());
    const email = parsed.email;
    return {
      id: parsed.id,
      plan,
      email,
      role: email && emails.includes(email.toLowerCase()) ? "admin" : "user",
      suspended: false,
    };
  } catch {
    return null;
  }
}

export async function getRequestIdentity(request: Request): Promise<RequestIdentity | null> {
  if (isSupabaseConfigured()) {
    const { user, supabase } = await requireUser();
    if (!user || !supabase) return null;
    const profile = await getProfile(supabase, user.id);
    const plan: PlanId = resolvePlanId(profile?.plan);
    return {
      id: user.id,
      plan,
      email: profile?.email ?? user.email ?? undefined,
      role: profile?.role === "admin" ? "admin" : "user",
      suspended: Boolean(profile?.isSuspended),
    };
  }
  return parseLocalUser(request);
}
