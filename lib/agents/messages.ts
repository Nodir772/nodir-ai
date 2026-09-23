import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { localAddAgentMessage, localListAgentMessages, type AgentChatMessage } from "@/lib/agents/chat-local";

type Row = {
  id: string;
  agent_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export async function listAgentMessages(
  supabase: SupabaseClient | null,
  userId: string,
  agentId: string,
): Promise<AgentChatMessage[]> {
  if (!supabase) return localListAgentMessages(userId, agentId);
  const { data, error } = await supabase
    .from("agent_messages")
    .select("id, agent_id, role, content, created_at")
    .eq("user_id", userId)
    .eq("agent_id", agentId)
    .order("created_at", { ascending: true })
    .limit(80);
  if (error) throw error;
  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    agentId: row.agent_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }));
}

export async function addAgentMessage(
  supabase: SupabaseClient | null,
  userId: string,
  agentId: string,
  role: "user" | "assistant",
  content: string,
) {
  if (!supabase) return localAddAgentMessage(userId, agentId, role, content);
  const { data, error } = await supabase
    .from("agent_messages")
    .insert({ user_id: userId, agent_id: agentId, role, content: content.slice(0, 16_000) })
    .select("id, agent_id, role, content, created_at")
    .single();
  if (error) throw error;
  const row = data as Row;
  return {
    id: row.id,
    agentId: row.agent_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}
