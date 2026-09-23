import { NextResponse } from "next/server";
import { requirePersistence } from "@/lib/db/http";
import { ensureProfile } from "@/lib/db/profiles";
import { createProject, listProjects } from "@/lib/db/projects";
import { isProjectIcon } from "@/lib/projects/types";
import { limitRoute } from "@/lib/security/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function parsePage(url: URL) {
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "40", 10);
  const offset = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);
  return {
    limit: Number.isFinite(limit) ? limit : 40,
    offset: Number.isFinite(offset) ? offset : 0,
  };
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    const page = parsePage(new URL(request.url));
    return NextResponse.json({ projects: [], total: 0, ...page, persistence: false });
  }
  const session = await requirePersistence();
  if (session.error) return session.error;
  const limited = limitRoute(request, "projects");
  if (!limited.ok) {
    return NextResponse.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  }

  try {
    await ensureProfile(session.supabase, session.user);
    const page = parsePage(new URL(request.url));
    const result = await listProjects(session.supabase, session.user.id, page);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Ma'lumotlarni yuklashda xatolik yuz berdi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const limited = limitRoute(request, "projects");
  if (!limited.ok) {
    return NextResponse.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    instructions?: string;
    icon?: string;
  };
  const name = body.name?.trim() ?? "";
  if (!name || name.length > 80) {
    return NextResponse.json({ error: "Loyiha nomi 1–80 belgi oralig'ida bo'lishi kerak." }, { status: 400 });
  }

  try {
    await ensureProfile(session.supabase, session.user);
    const project = await createProject(session.supabase, session.user.id, {
      name,
      description: (body.description ?? "").trim().slice(0, 500),
      instructions: (body.instructions ?? "").trim().slice(0, 8000),
      icon: body.icon && isProjectIcon(body.icon) ? body.icon : "folder",
    });
    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "Ma'lumotlarni saqlashda xatolik yuz berdi." }, { status: 500 });
  }
}
