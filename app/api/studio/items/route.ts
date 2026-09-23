import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { ensureProfile } from "@/lib/db/profiles";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ownedRow, ownedStatus } from "@/lib/projects/access";
import { isStudioKind } from "@/lib/ai/studio/kinds";

export async function GET(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  if (!isSupabaseConfigured()) return Response.json({ items: [], persistence: false });
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "";
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "20") || 20));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? "0") || 0);
  let query = supabase
    .from("studio_items")
    .select("id, type, title, project_id, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (isStudioKind(type)) query = query.eq("type", type);
  if (q) query = query.ilike("title", `%${q.replace(/[%_]/g, "")}%`);
  const { data, error } = await query;
  if (error) return Response.json({ items: [], persistence: true });
  return Response.json({ items: data ?? [], persistence: true });
}

export async function POST(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  if (!isSupabaseConfigured()) return Response.json({ error: "Saqlash uchun Supabase kerak." }, { status: 503 });
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  await ensureProfile(supabase, user);
  const body = (await request.json().catch(() => ({}))) as {
    type?: string;
    title?: string;
    projectId?: string | null;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
  };
  if (!body.type || !isStudioKind(body.type)) {
    return Response.json({ error: "Noto'g'ri tur." }, { status: 400 });
  }
  if (body.projectId) {
    const { data: project } = await supabase.from("projects").select("id, user_id").eq("id", body.projectId).maybeSingle();
    const owned = ownedRow(
      project ? { userId: (project as { user_id: string }).user_id } : null,
      user.id,
    );
    if (!owned.ok) {
      const status = ownedStatus(owned);
      return Response.json({ error: "Loyiha topilmadi.", code: status.code }, { status: status.status });
    }
  }
  const { data, error } = await supabase
    .from("studio_items")
    .insert({
      user_id: user.id,
      project_id: body.projectId || null,
      type: body.type,
      title: (body.title ?? "").slice(0, 160) || "Studio",
      input_metadata: body.input ?? {},
      output_metadata: body.output ?? {},
    })
    .select("id")
    .single();
  if (error || !data) return Response.json({ error: "Saqlanmadi." }, { status: 500 });
  return Response.json({ ok: true, id: data.id });
}

export async function DELETE(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  if (!isSupabaseConfigured()) return Response.json({ error: "O'chirish uchun Supabase kerak." }, { status: 503 });
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim() ?? "";
  if (!id) return Response.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
  const { data } = await supabase.from("studio_items").select("id, user_id").eq("id", id).maybeSingle();
  const owned = ownedRow(data ? { userId: (data as { user_id: string }).user_id } : null, user.id);
  if (!owned.ok) {
    const status = ownedStatus(owned);
    return Response.json({ error: "Topilmadi.", code: status.code }, { status: status.status });
  }
  await supabase.from("studio_items").delete().eq("id", id).eq("user_id", user.id);
  return Response.json({ ok: true });
}
