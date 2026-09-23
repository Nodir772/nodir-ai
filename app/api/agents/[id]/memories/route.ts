import { getAppSession, unauthorizedJson } from "@/lib/auth/app-session";
import { requireAgent } from "@/lib/agents/guard";
import { createMemory, getMemories, deleteMemory } from "@/lib/memory";
import { limitRoute } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const limited = limitRoute(request, "memories");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p." }, { status: 429 });
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const { id } = await context.params;
  const resolved = await requireAgent(session, id, false);
  if (!resolved.ok) return resolved.response;
  const memories = await getMemories(session.supabase, session.identity.id, { agentId: id });
  return Response.json({ memories });
}

export async function POST(request: Request, context: Ctx) {
  const limited = limitRoute(request, "memories");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p." }, { status: 429 });
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const { id } = await context.params;
  const resolved = await requireAgent(session, id, false);
  if (!resolved.ok) return resolved.response;
  const body = (await request.json().catch(() => ({}))) as { content?: string; category?: string };
  const result = await createMemory(
    session.supabase,
    session.identity.id,
    body.content ?? "",
    body.category ?? "general",
    null,
    id,
  );
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ memory: result.memory });
}

export async function DELETE(request: Request, context: Ctx) {
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const { id } = await context.params;
  const resolved = await requireAgent(session, id, false);
  if (!resolved.ok) return resolved.response;
  const url = new URL(request.url);
  const memoryId = url.searchParams.get("memoryId");
  if (!memoryId) return Response.json({ error: "memoryId kerak." }, { status: 400 });
  const memories = await getMemories(session.supabase, session.identity.id, { agentId: id });
  if (!memories.some((item) => item.id === memoryId)) {
    return Response.json({ error: "Xotira topilmadi." }, { status: 404 });
  }
  await deleteMemory(session.supabase, session.identity.id, memoryId);
  return Response.json({ ok: true });
}
