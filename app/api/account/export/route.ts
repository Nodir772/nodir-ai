import { requirePersistence } from "@/lib/db/http";
import { getConversations } from "@/lib/db/conversations";
import { getMessages } from "@/lib/db/messages";
import { getSettings } from "@/lib/db/settings";
import { getMemories } from "@/lib/memory";
import { conversationToMarkdown, conversationToText } from "@/lib/export/conversation";
import { limitRoute } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  const limited = limitRoute(request, "default");
  if (!limited.ok) {
    return Response.json({ error: "Juda ko'p so'rov yuborildi. Biroz kuting.", code: "RATE_LIMIT" }, { status: 429 });
  }
  const session = await requirePersistence();
  if (session.error) return session.error;

  const format = new URL(request.url).searchParams.get("format") ?? "json";
  const conversations = await getConversations(session.supabase, session.user.id);
  const chats = [];
  for (const conversation of conversations.slice(0, 200)) {
    const loaded = await getMessages(session.supabase, session.user.id, conversation.id);
    chats.push({
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: loaded.messages.map((message) => ({
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      })),
    });
  }
  const settings = await getSettings(session.supabase, session.user.id);
  const memories = await getMemories(session.supabase, session.user.id).catch(() => []);

  const payload = {
    exportedAt: new Date().toISOString(),
    conversations: chats,
    settings: settings
      ? {
          theme: settings.theme,
          defaultModel: settings.defaultModel,
          responseStyle: settings.responseStyle,
          memoryEnabled: settings.memoryEnabled,
          personaId: settings.personaId,
          useCase: settings.useCase,
        }
      : null,
    memories: memories.map((item) => ({ content: item.content, category: item.category })),
  };

  if (format === "md") {
    const body = chats
      .map((chat) => conversationToMarkdown(chat.title, chat.updatedAt, chat.messages))
      .join("\n\n---\n\n");
    return new Response(body, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="nodir-ai-export.md"',
      },
    });
  }
  if (format === "txt") {
    const body = chats
      .map((chat) => conversationToText(chat.title, chat.updatedAt, chat.messages))
      .join("\n\n----\n\n");
    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="nodir-ai-export.txt"',
      },
    });
  }

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nodir-ai-export.json"',
    },
  });
}
