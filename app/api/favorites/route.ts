import { requirePersistence } from "@/lib/db/http";

export async function GET() {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const { data, error } = await session.supabase
    .from("favorites")
    .select("id, item_type, item_id, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) return Response.json({ error: "Ma'lumotlarni yuklashda xatolik yuz berdi." }, { status: 500 });
  const rows = data ?? [];
  const conversationIds = rows.filter((row) => row.item_type === "conversation").map((row) => row.item_id);
  const messageIds = rows.filter((row) => row.item_type === "message").map((row) => row.item_id);
  const projectIds = rows.filter((row) => row.item_type === "project").map((row) => row.item_id);
  const agentIds = rows.filter((row) => row.item_type === "agent").map((row) => row.item_id);

  const titles = new Map<string, string>();
  if (conversationIds.length) {
    const { data: chats } = await session.supabase
      .from("conversations")
      .select("id, title")
      .eq("user_id", session.user.id)
      .in("id", conversationIds);
    for (const chat of chats ?? []) titles.set(chat.id, chat.title);
  }

  const snippets = new Map<string, string>();
  if (messageIds.length) {
    const { data: messages } = await session.supabase
      .from("messages")
      .select("id, content")
      .in("id", messageIds)
      .limit(80);
    for (const message of messages ?? []) {
      snippets.set(message.id, String(message.content).slice(0, 240));
    }
  }

  if (projectIds.length) {
    const { data: projects } = await session.supabase
      .from("projects")
      .select("id, name")
      .eq("user_id", session.user.id)
      .in("id", projectIds);
    for (const project of projects ?? []) titles.set(project.id, project.name);
  }

  if (agentIds.length) {
    const { getBuiltinAgent } = await import("@/lib/agents/catalog");
    for (const id of agentIds) {
      const builtin = getBuiltinAgent(id);
      if (builtin) titles.set(id, builtin.name);
    }
    const customIds = agentIds.filter((id) => !titles.has(id));
    if (customIds.length) {
      const { data: agents } = await session.supabase
        .from("agents")
        .select("id, name")
        .eq("user_id", session.user.id)
        .in("id", customIds);
      for (const agent of agents ?? []) titles.set(agent.id, agent.name);
    }
  }

  return Response.json({
    favorites: rows.map((row) => ({
      ...row,
      title: titles.get(row.item_id),
      snippet: snippets.get(row.item_id),
    })),
  });
}

export async function POST(request: Request) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const body = (await request.json().catch(() => ({}))) as {
    itemType?: string;
    itemId?: string;
  };
  if (!body.itemId || !["conversation", "image", "message", "project", "agent"].includes(body.itemType ?? "")) {
    return Response.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
  }
  const { error } = await session.supabase.from("favorites").upsert(
    {
      user_id: session.user.id,
      item_type: body.itemType,
      item_id: body.itemId,
    },
    { onConflict: "user_id,item_type,item_id" },
  );
  if (error) return Response.json({ error: "Ma'lumotlarni saqlashda xatolik yuz berdi." }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const url = new URL(request.url);
  const itemType = url.searchParams.get("itemType");
  const itemId = url.searchParams.get("itemId");
  if (!itemType || !itemId) return Response.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
  await session.supabase
    .from("favorites")
    .delete()
    .eq("user_id", session.user.id)
    .eq("item_type", itemType)
    .eq("item_id", itemId);
  return Response.json({ ok: true });
}
