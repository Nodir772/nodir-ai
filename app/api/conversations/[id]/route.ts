import { NextResponse } from "next/server";
import {
  deleteConversation,
  getConversation,
  updateConversationTitle,
} from "@/lib/db/conversations";
import { DB_ERRORS } from "@/lib/db/errors";
import { requirePersistence } from "@/lib/db/http";
import { getMessages } from "@/lib/db/messages";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const { id } = await context.params;

  try {
    const owned = await getConversation(session.supabase, session.user.id, id);
    if (owned.forbidden) {
      return NextResponse.json({ error: DB_ERRORS.forbidden, code: "FORBIDDEN" }, { status: 403 });
    }
    if (!owned.conversation) {
      return NextResponse.json({ error: DB_ERRORS.notFound, code: "NOT_FOUND" }, { status: 404 });
    }
    const loaded = await getMessages(session.supabase, session.user.id, id);
    return NextResponse.json({ conversation: owned.conversation, messages: loaded.messages });
  } catch {
    return NextResponse.json({ error: DB_ERRORS.load, code: "DATABASE_ERROR" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const { id } = await context.params;

  let title = "";
  try {
    const body = (await request.json()) as { title?: string };
    title = body.title?.trim() || "Yangi suhbat";
  } catch {
    return NextResponse.json({ error: "So'rov noto'g'ri formatda.", code: "INVALID_JSON" }, { status: 400 });
  }

  try {
    const result = await updateConversationTitle(session.supabase, session.user.id, id, title);
    if (result.forbidden) {
      return NextResponse.json({ error: DB_ERRORS.forbidden, code: "FORBIDDEN" }, { status: 403 });
    }
    if (!result.conversation) {
      return NextResponse.json({ error: DB_ERRORS.notFound, code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ conversation: result.conversation });
  } catch {
    return NextResponse.json({ error: DB_ERRORS.save, code: "DATABASE_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const { id } = await context.params;

  try {
    const result = await deleteConversation(session.supabase, session.user.id, id);
    if (result.forbidden) {
      return NextResponse.json({ error: DB_ERRORS.forbidden, code: "FORBIDDEN" }, { status: 403 });
    }
    if (!result.conversation) {
      return NextResponse.json({ error: DB_ERRORS.notFound, code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: DB_ERRORS.save, code: "DATABASE_ERROR" }, { status: 500 });
  }
}
