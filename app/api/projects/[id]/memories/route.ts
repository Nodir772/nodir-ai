import { NextResponse } from "next/server";
import { requirePersistence } from "@/lib/db/http";
import { getProject } from "@/lib/db/projects";
import { createMemory, getMemories } from "@/lib/memory";
import { ownedStatus } from "@/lib/projects/access";
import { limitRoute } from "@/lib/security/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

function deny(owned: { ok: false; forbidden: boolean; missing: boolean }) {
  const { status, code } = ownedStatus(owned);
  return NextResponse.json(
    {
      error: owned.forbidden ? "Bu loyihaga kirish huquqingiz yo'q." : "Loyiha topilmadi.",
      code,
    },
    { status },
  );
}

export async function GET(request: Request, context: RouteContext) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const limited = limitRoute(request, "memories");
  if (!limited.ok) {
    return NextResponse.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  }
  const { id } = await context.params;
  try {
    const owned = await getProject(session.supabase, session.user.id, id);
    if (!owned.ok) return deny(owned);
    const memories = await getMemories(session.supabase, session.user.id, { projectId: id });
    return NextResponse.json({ memories });
  } catch {
    return NextResponse.json({ error: "Ma'lumotlarni yuklashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const limited = limitRoute(request, "memories");
  if (!limited.ok) {
    return NextResponse.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  }
  const { id } = await context.params;
  const owned = await getProject(session.supabase, session.user.id, id);
  if (!owned.ok) return deny(owned);
  const body = (await request.json().catch(() => ({}))) as { content?: string; category?: string };
  const result = await createMemory(
    session.supabase,
    session.user.id,
    body.content ?? "",
    body.category ?? "project",
    id,
  );
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ memory: result.memory });
}
