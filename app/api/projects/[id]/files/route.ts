import { NextResponse } from "next/server";
import { requirePersistence } from "@/lib/db/http";
import { listProjectDocuments } from "@/lib/db/projects";
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
  const limited = limitRoute(request, "projects");
  if (!limited.ok) {
    return NextResponse.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  }
  const { id } = await context.params;
  const url = new URL(request.url);
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "40", 10);
  const offset = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);
  try {
    const result = await listProjectDocuments(session.supabase, session.user.id, id, {
      limit: Number.isFinite(limit) ? limit : 40,
      offset: Number.isFinite(offset) ? offset : 0,
    });
    if (!result.ok) return deny(result);
    return NextResponse.json({
      files: result.documents,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  } catch {
    return NextResponse.json({ error: "Ma'lumotlarni yuklashda xatolik yuz berdi." }, { status: 500 });
  }
}

