import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbMessage } from "@/lib/db/types";
import { getConversation } from "@/lib/db/conversations";

type MessageRow = {
  id: string;
  conversation_id: string;
  role: DbMessage["role"];
  content: string;
  created_at: string;
};

function mapMessage(row: MessageRow): DbMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function getMessages(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
) {
  const owned = await getConversation(supabase, userId, conversationId);
  if (owned.forbidden) return { messages: [] as DbMessage[], forbidden: true, missing: false };
  if (!owned.conversation) return { messages: [] as DbMessage[], forbidden: false, missing: true };

  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return {
    messages: ((data ?? []) as MessageRow[]).map(mapMessage),
    forbidden: false,
    missing: false,
  };
}

export async function saveMessage(
  supabase: SupabaseClient,
  userId: string,
  input: { conversationId: string; role: DbMessage["role"]; content: string; id?: string },
) {
  const owned = await getConversation(supabase, userId, input.conversationId);
  if (owned.forbidden) return { message: null as DbMessage | null, forbidden: true, missing: false };
  if (!owned.conversation) return { message: null, forbidden: false, missing: true };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      ...(input.id ? { id: input.id } : {}),
      conversation_id: input.conversationId,
      role: input.role,
      content: input.content,
    })
    .select("id, conversation_id, role, content, created_at")
    .single();
  if (error) throw error;
  return { message: mapMessage(data as MessageRow), forbidden: false, missing: false };
}

export async function deleteLastAssistantMessage(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
) {
  const loaded = await getMessages(supabase, userId, conversationId);
  if (loaded.forbidden || loaded.missing) return loaded;
  const last = [...loaded.messages].reverse().find((message) => message.role === "assistant");
  if (!last) return loaded;
  const { error } = await supabase.from("messages").delete().eq("id", last.id);
  if (error) throw error;
  return getMessages(supabase, userId, conversationId);
}

export async function updateMessageContent(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  messageId: string,
  content: string,
) {
  const loaded = await getMessages(supabase, userId, conversationId);
  if (loaded.forbidden || loaded.missing) {
    return { ...loaded, message: null as DbMessage | null };
  }
  const target = loaded.messages.find((message) => message.id === messageId);
  if (!target || target.role !== "user") {
    return { messages: loaded.messages, forbidden: false, missing: true, message: null as DbMessage | null };
  }
  const { data, error } = await supabase
    .from("messages")
    .update({ content })
    .eq("id", messageId)
    .select("id, conversation_id, role, content, created_at")
    .single();
  if (error) throw error;
  return {
    messages: loaded.messages.map((message) => (message.id === messageId ? mapMessage(data as MessageRow) : message)),
    forbidden: false,
    missing: false,
    message: mapMessage(data as MessageRow),
  };
}

export async function deleteMessagesAfter(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  messageId: string,
) {
  const loaded = await getMessages(supabase, userId, conversationId);
  if (loaded.forbidden || loaded.missing) return loaded;
  const index = loaded.messages.findIndex((message) => message.id === messageId);
  if (index < 0) return { ...loaded, missing: true };
  const toDelete = loaded.messages.slice(index + 1).map((message) => message.id);
  if (!toDelete.length) return loaded;
  const { error } = await supabase.from("messages").delete().in("id", toDelete);
  if (error) throw error;
  return getMessages(supabase, userId, conversationId);
}
