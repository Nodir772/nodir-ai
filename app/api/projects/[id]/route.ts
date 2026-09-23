import { NextResponse } from "next/server";
import { requirePersistence } from "@/lib/db/http";
import { deleteProject, getProject, updateProject } from "@/lib/db/projects";
import { isProjectIcon } from "@/lib/projects/types";
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
  try {
    const owned = await getProject(session.supabase, session.user.id, id);
    if (!owned.ok) return deny(owned);
    return NextResponse.json({ project: owned.row });
  } catch {
    return NextResponse.json({ error: "Ma'lumotlarni yuklashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const limited = limitRoute(request, "projects");
  if (!limited.ok) {
    return NextResponse.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  }
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    instructions?: string;
    icon?: string;
    favorite?: boolean;
  };
  const patch: {
    name?: string;
    description?: string;
    instructions?: string;
    icon?: "folder" | "book" | "code" | "pen" | "search" | "spark";
    favorite?: boolean;
  } = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name || name.length > 80) {
      return NextResponse.json({ error: "Loyiha nomi 1–80 belgi oralig'ida bo'lishi kerak." }, { status: 400 });
    }
    patch.name = name;
  }
  if (typeof body.description === "string") patch.description = body.description.trim().slice(0, 500);
  if (typeof body.instructions === "string") patch.instructions = body.instructions.trim().slice(0, 8000);
  if (typeof body.favorite === "boolean") patch.favorite = body.favorite;
  if (typeof body.icon === "string" && isProjectIcon(body.icon)) patch.icon = body.icon;

  try {
    const owned = await updateProject(session.supabase, session.user.id, id, patch);
    if (!owned.ok) return deny(owned);
    return NextResponse.json({ project: owned.row });
  } catch {
    return NextResponse.json({ error: "Ma'lumotlarni saqlashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const { id } = await context.params;
  try {
    const owned = await deleteProject(session.supabase, session.user.id, id);
    if (!owned.ok) return deny(owned);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ma'lumotlarni saqlashda xatolik yuz berdi." }, { status: 500 });
  }
}
