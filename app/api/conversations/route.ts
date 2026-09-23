import { NextResponse } from "next/server";
import { createConversation, getConversations } from "@/lib/db/conversations";
import { getProject } from "@/lib/db/projects";
import { DB_ERRORS } from "@/lib/db/errors";
import { requirePersistence } from "@/lib/db/http";
import { ensureProfile } from "@/lib/db/profiles";

export async function GET() {
  const session = await requirePersistence();
  if (session.error) return session.error;

  try {
    await ensureProfile(session.supabase, session.user);
    const conversations = await getConversations(session.supabase, session.user.id);
    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json({ error: DB_ERRORS.load, code: "DATABASE_ERROR" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requirePersistence();
  if (session.error) return session.error;

  let projectId: string | null = null;
  try {
    const body = (await request.json().catch(() => ({}))) as { projectId?: string };
    if (typeof body.projectId === "string" && body.projectId.trim()) {
      projectId = body.projectId.trim();
    }
  } catch {
    projectId = null;
  }

  try {
    await ensureProfile(session.supabase, session.user);
    if (projectId) {
      const owned = await getProject(session.supabase, session.user.id, projectId);
      if (!owned.ok) {
        if (owned.forbidden) {
          return NextResponse.json({ error: "Bu loyihaga kirish huquqingiz yo'q.", code: "FORBIDDEN" }, { status: 403 });
        }
        return NextResponse.json({ error: "Loyiha topilmadi.", code: "NOT_FOUND" }, { status: 404 });
      }
    }
    const conversation = await createConversation(
      session.supabase,
      session.user.id,
      "Yangi suhbat",
      projectId,
    );
    return NextResponse.json({ conversation });
  } catch {
    return NextResponse.json({ error: DB_ERRORS.save, code: "DATABASE_ERROR" }, { status: 500 });
  }
}
