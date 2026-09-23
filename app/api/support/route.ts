import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { ensureProfile } from "@/lib/db/profiles";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { limitRoute } from "@/lib/security/rate-limit";

const CATEGORIES = ["account", "billing", "ai", "bug", "feature", "other"] as const;

export async function GET(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  if (!isSupabaseConfigured()) return Response.json({ tickets: [], persistence: false });
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, subject, category, message, status, admin_reply, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return Response.json({ tickets: [], persistence: true });
  return Response.json({ tickets: data ?? [], persistence: true });
}

export async function POST(request: Request) {
  const limited = limitRoute(request, "support");
  if (!limited.ok) {
    return Response.json({ error: "Juda ko'p so'rov yuborildi. Biroz kuting.", code: "RATE_LIMIT" }, { status: 429 });
  }
  const identity = await getRequestIdentity(request);
  if (!identity) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { subject?: string; category?: string; message?: string };
  const subject = body.subject?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const category = (CATEGORIES as readonly string[]).includes(body.category ?? "") ? body.category! : "other";
  if (!subject || !message) return Response.json({ error: "Mavzu va xabar kerak." }, { status: 400 });
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Support uchun Supabase kerak." }, { status: 503 });
  }
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  await ensureProfile(supabase, user);
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({ user_id: user.id, subject: subject.slice(0, 160), category, message: message.slice(0, 4000) })
    .select("id")
    .single();
  if (error || !data) return Response.json({ error: "Yuborib bo'lmadi." }, { status: 500 });
  return Response.json({ ok: true, id: data.id });
}
