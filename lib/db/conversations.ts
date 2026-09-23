import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbConversation } from "@/lib/db/types";

type ConversationRow = {
  id: string;
  user_id: string;
  title: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
};

const CONVERSATION_SELECT = "id, user_id, title, project_id, created_at, updated_at";

function mapConversation(row: ConversationRow): DbConversation {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    projectId: row.project_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createConversation(
  supabase: SupabaseClient,
  userId: string,
  title = "Yangi suhbat",
  projectId?: string | null,
) {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, title, project_id: projectId ?? null })
    .select(CONVERSATION_SELECT)
    .single();
  if (error) throw error;
  return mapConversation(data as ConversationRow);
}

export async function getConversations(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as ConversationRow[]).map(mapConversation);
}

export async function getConversation(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { conversation: null as DbConversation | null, forbidden: false };
  const conversation = mapConversation(data as ConversationRow);
  if (conversation.userId !== userId) {
    return { conversation: null, forbidden: true };
  }
  return { conversation, forbidden: false };
}

export async function updateConversationTitle(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  title: string,
) {
  const owned = await getConversation(supabase, userId, conversationId);
  if (owned.forbidden || !owned.conversation) return owned;
  const { data, error } = await supabase
    .from("conversations")
    .update({ title })
    .eq("id", conversationId)
    .eq("user_id", userId)
    .select(CONVERSATION_SELECT)
    .single();
  if (error) throw error;
  return { conversation: mapConversation(data as ConversationRow), forbidden: false };
}

export async function updateConversationProject(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  projectId: string | null,
) {
  const owned = await getConversation(supabase, userId, conversationId);
  if (owned.forbidden || !owned.conversation) return owned;
  const { data, error } = await supabase
    .from("conversations")
    .update({ project_id: projectId })
    .eq("id", conversationId)
    .eq("user_id", userId)
    .select(CONVERSATION_SELECT)
    .single();
  if (error) throw error;
  return { conversation: mapConversation(data as ConversationRow), forbidden: false };
}

export async function deleteConversation(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
) {
  const owned = await getConversation(supabase, userId, conversationId);
  if (owned.forbidden || !owned.conversation) return owned;
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);
  if (error) throw error;
  return { conversation: owned.conversation, forbidden: false };
}

export async function deleteAllConversations(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("conversations").delete().eq("user_id", userId);
  if (error) throw error;
}
