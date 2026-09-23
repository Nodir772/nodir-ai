import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createMemory, deleteAllMemories, getMemories } from "@/lib/memory";
import { limitRoute } from "@/lib/security/rate-limit";

async function session(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) return null;
  if (!isSupabaseConfigured()) return { identity, supabase: null };
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return null;
  return { identity: { ...identity, id: user.id }, supabase };
}

export async function GET(request: Request) {
  const limited = limitRoute(request, "memories");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p." }, { status: 429 });
  const ctx = await session(request);
  if (!ctx) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  try {
    const url = new URL(request.url);
    const agentId = url.searchParams.get("agentId");
    const memories = await getMemories(ctx.supabase, ctx.identity.id, agentId ? { agentId } : undefined);
    return Response.json({ memories });
  } catch {
    return Response.json({ error: "Ma'lumotlarni yuklashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const limited = limitRoute(request, "memories");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p." }, { status: 429 });
  const ctx = await session(request);
  if (!ctx) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    content?: string;
    category?: string;
    projectId?: string | null;
    agentId?: string | null;
  };
  const result = await createMemory(
    ctx.supabase,
    ctx.identity.id,
    body.content ?? "",
    body.category ?? "general",
    body.projectId,
    body.agentId,
  );
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ memory: result.memory });
}

export async function DELETE(request: Request) {
  const ctx = await session(request);
  if (!ctx) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { confirm?: boolean };
  if (!body.confirm) return Response.json({ error: "O'chirish uchun tasdiq kerak." }, { status: 400 });
  await deleteAllMemories(ctx.supabase, ctx.identity.id);
  return Response.json({ ok: true });
}
