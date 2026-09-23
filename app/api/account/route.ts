import { NextResponse } from "next/server";
import { requirePersistence } from "@/lib/db/http";
import { deleteAllMemories } from "@/lib/memory";
import { deleteAllConversations } from "@/lib/db/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { confirm?: boolean };
  if (!body.confirm) {
    return NextResponse.json({ error: "O'chirish uchun tasdiq kerak." }, { status: 400 });
  }

  const session = await requirePersistence();
  if (session.error) {
    return NextResponse.json({ error: "Hisobni o'chirish uchun Supabase kerak." }, { status: 503 });
  }

  await deleteAllMemories(session.supabase, session.user.id);
  await deleteAllConversations(session.supabase, session.user.id);

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (service && url) {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(url, service, { auth: { persistSession: false } });
    await admin.auth.admin.deleteUser(session.user.id);
    return NextResponse.json({ ok: true, deletedAuth: true });
  }

  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  return NextResponse.json({
    ok: true,
    deletedAuth: false,
    notice: "Suhbat va xotiralar o'chirildi. Auth foydalanuvchisini o'chirish uchun service role kaliti kerak.",
  });
}
