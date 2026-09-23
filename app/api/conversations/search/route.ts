import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) {
    return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return Response.json({ conversations: [] });
  if (q.length > 80) {
    return Response.json({ error: "Qidiruv so'rovi juda uzun." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return Response.json({ conversations: null, local: true, query: q });
  }

  const { user, supabase } = await requireUser();
  if (!user || !supabase) {
    return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  }

  const like = `%${q.replace(/[%_]/g, "\\$&")}%`;
  const { data: titled } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .ilike("title", like)
    .order("updated_at", { ascending: false })
    .limit(20);

  const { data: messageHits } = await supabase
    .from("messages")
    .select("conversation_id, content, conversations!inner(user_id, title, updated_at)")
    .ilike("content", like)
    .eq("conversations.user_id", user.id)
    .limit(40);

  const map = new Map<string, { id: string; title: string; updatedAt: string }>();
  for (const row of titled ?? []) {
    map.set(row.id, { id: row.id, title: row.title, updatedAt: row.updated_at });
  }
  for (const row of messageHits ?? []) {
    const conv = row.conversations as unknown as { user_id: string; title: string; updated_at: string };
    if (!map.has(row.conversation_id)) {
      map.set(row.conversation_id, {
        id: row.conversation_id,
        title: conv.title,
        updatedAt: conv.updated_at,
      });
    }
  }

  return Response.json({ conversations: [...map.values()] });
}
