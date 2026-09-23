import { NextResponse } from "next/server";
import { requirePersistence } from "@/lib/db/http";
import { DB_ERRORS } from "@/lib/db/errors";
import { ensureProfile, updateProfile } from "@/lib/db/profiles";

export async function GET() {
  const session = await requirePersistence();
  if (session.error) return session.error;
  try {
    const profile = await ensureProfile(session.supabase, session.user);
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: DB_ERRORS.load, code: "DATABASE_ERROR" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requirePersistence();
  if (session.error) return session.error;

  let name: string | undefined;
  try {
    const body = (await request.json()) as { name?: string };
    name = body.name?.trim();
  } catch {
    return NextResponse.json({ error: "So'rov noto'g'ri formatda.", code: "INVALID_JSON" }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json({ error: "Ism bo'sh bo'lmasligi kerak.", code: "INVALID_NAME" }, { status: 400 });
  }

  try {
    const profile = await updateProfile(session.supabase, session.user.id, { name });
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: DB_ERRORS.save, code: "DATABASE_ERROR" }, { status: 500 });
  }
}
