import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { getConversation } from "@/lib/db/conversations";
import { getMessages } from "@/lib/db/messages";
import { ensureProfile } from "@/lib/db/profiles";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { assertFeature, entitlementJson } from "@/lib/billing/entitlements";

function publicMessages(
  messages: { role?: string; content?: string; created_at?: string; createdAt?: string }[],
) {
  return messages
    .filter((message) => (message.role === "user" || message.role === "assistant") && message.content)
    .map((message) => ({
      role: message.role as string,
      content: message.content as string,
      createdAt: message.createdAt ?? message.created_at ?? new Date().toISOString(),
    }));
}

export async function POST(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) {
    return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  }
  const shareGate = await assertFeature(identity, "public_sharing");
  if (!shareGate.ok) return entitlementJson(shareGate);

  const body = (await request.json().catch(() => ({}))) as {
    content?: string;
    title?: string;
    confirm?: boolean;
    conversationId?: string;
    messages?: { role?: string; content?: string; createdAt?: string }[];
  };
  if (!body.confirm) {
    return Response.json({ error: "Ulashish uchun tasdiq kerak." }, { status: 400 });
  }

  const token = crypto.randomUUID();

  if (body.conversationId || body.messages?.length) {
    let payload = publicMessages(body.messages ?? []);
    let title = (body.title ?? "Nodir AI suhbat").slice(0, 120);

    if (isSupabaseConfigured() && body.conversationId) {
      const { user, supabase } = await requireUser();
      if (!user || !supabase) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
      await ensureProfile(supabase, user);
      const owned = await getConversation(supabase, user.id, body.conversationId);
      if (owned.forbidden) return Response.json({ error: "Ruxsat yo'q." }, { status: 403 });
      if (!owned.conversation) return Response.json({ error: "Suhbat topilmadi." }, { status: 404 });
      const loaded = await getMessages(supabase, user.id, body.conversationId);
      payload = publicMessages(loaded.messages);
      title = owned.conversation.title;
      const { data, error } = await supabase
        .from("shared_conversations")
        .insert({
          user_id: user.id,
          token,
          title,
          messages: payload,
          is_public: true,
        })
        .select("token")
        .single();
      if (error || !data) {
        return Response.json({ error: "Ulashishda xatolik yuz berdi." }, { status: 500 });
      }
      return Response.json({ url: `/share/${data.token}`, token: data.token, kind: "conversation" });
    }

    if (!payload.length) {
      return Response.json({ error: "Ulashish uchun matn yo'q." }, { status: 400 });
    }
    return Response.json({
      url: `/share/${token}`,
      token,
      ephemeral: true,
      kind: "conversation",
      title,
      messages: payload,
    });
  }

  const content = body.content?.trim() ?? "";
  if (!content) return Response.json({ error: "Ulashish uchun matn yo'q." }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return Response.json({
      url: `/s/${token}`,
      token,
      ephemeral: true,
      content,
      title: body.title ?? "Nodir AI javobi",
    });
  }

  const { user, supabase } = await requireUser();
  if (!user || !supabase) {
    return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  }
  await ensureProfile(supabase, user);
  const { data, error } = await supabase
    .from("shared_messages")
    .insert({
      user_id: user.id,
      token,
      title: body.title ?? "Nodir AI javobi",
      content,
      is_public: true,
    })
    .select("token")
    .single();
  if (error || !data) {
    return Response.json({ error: "Ulashishda xatolik yuz berdi." }, { status: 500 });
  }
  return Response.json({ url: `/s/${data.token}`, token: data.token, kind: "message" });
}
