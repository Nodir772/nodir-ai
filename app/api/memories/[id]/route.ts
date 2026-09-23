import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { deleteMemory, updateMemory } from "@/lib/memory";

async function session(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) return null;
  if (!isSupabaseConfigured()) return { identity, supabase: null };
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return null;
  return { identity: { ...identity, id: user.id }, supabase };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = await session(request);
  if (!ctx) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { content?: string; category?: string };
  const result = await updateMemory(ctx.supabase, ctx.identity.id, id, body);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ memory: result.memory });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = await session(request);
  if (!ctx) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  const { id } = await context.params;
  await deleteMemory(ctx.supabase, ctx.identity.id, id);
  return Response.json({ ok: true });
}
