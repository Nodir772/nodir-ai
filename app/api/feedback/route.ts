import { NextResponse } from "next/server";
import { requirePersistence } from "@/lib/db/http";
import { getMessages } from "@/lib/db/messages";

export async function POST(request: Request) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const body = (await request.json().catch(() => ({}))) as {
    messageId?: string;
    conversationId?: string;
    rating?: "like" | "dislike" | null;
  };
  if (!body.messageId || !body.conversationId) {
    return NextResponse.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
  }
  if (body.rating !== "like" && body.rating !== "dislike" && body.rating !== null) {
    return NextResponse.json({ error: "Noto'g'ri baho." }, { status: 400 });
  }

  const loaded = await getMessages(session.supabase, session.user.id, body.conversationId);
  if (loaded.forbidden) {
    return NextResponse.json({ error: "Bu suhbatga kirish huquqingiz yo'q.", code: "FORBIDDEN" }, { status: 403 });
  }
  if (loaded.missing) {
    return NextResponse.json({ error: "Suhbat topilmadi.", code: "NOT_FOUND" }, { status: 404 });
  }
  const belongs = loaded.messages.some((message) => message.id === body.messageId);
  if (!belongs) {
    return NextResponse.json({ error: "Xabar topilmadi.", code: "NOT_FOUND" }, { status: 404 });
  }

  if (body.rating === null) {
    await session.supabase
      .from("message_feedback")
      .delete()
      .eq("user_id", session.user.id)
      .eq("message_id", body.messageId);
    return NextResponse.json({ ok: true });
  }

  const { error } = await session.supabase.from("message_feedback").upsert(
    {
      user_id: session.user.id,
      message_id: body.messageId,
      rating: body.rating,
    },
    { onConflict: "user_id,message_id" },
  );
  if (error) {
    return NextResponse.json({ error: "Ma'lumotlarni saqlashda xatolik yuz berdi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
