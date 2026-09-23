import { NextResponse } from "next/server";
import { deleteAllConversations } from "@/lib/db/conversations";
import { DB_ERRORS } from "@/lib/db/errors";
import { requirePersistence } from "@/lib/db/http";
import { ensureProfile } from "@/lib/db/profiles";

export async function DELETE(request: Request) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const body = (await request.json().catch(() => ({}))) as { confirm?: boolean };
  if (!body.confirm) {
    return NextResponse.json({ error: "O'chirish uchun tasdiq kerak." }, { status: 400 });
  }
  try {
    await ensureProfile(session.supabase, session.user);
    await deleteAllConversations(session.supabase, session.user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: DB_ERRORS.save, code: "DATABASE_ERROR" }, { status: 500 });
  }
}
