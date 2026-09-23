import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Memory, MemoryCategory } from "@/lib/memory/types";
import { isMemoryCategory } from "@/lib/memory/types";

type Row = {
  id: string;
  user_id: string;
  content: string;
  category: string;
  project_id: string | null;
  agent_id?: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: Row): Memory {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    category: isMemoryCategory(row.category) ? row.category : "general",
    projectId: row.project_id ?? null,
    agentId: row.agent_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const MEMORY_SELECT = "id, user_id, content, category, project_id, agent_id, created_at, updated_at";

export async function dbGetMemories(
  supabase: SupabaseClient,
  userId: string,
  options?: { projectId?: string | null; agentId?: string | null },
) {
  let query = supabase.from("memories").select(MEMORY_SELECT).eq("user_id", userId);
  if (options?.agentId) query = query.eq("agent_id", options.agentId);
  else query = query.is("agent_id", null);
  if (options && "projectId" in options) {
    if (options.projectId) query = query.eq("project_id", options.projectId);
    else query = query.is("project_id", null);
  }
  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Row[]).map(mapRow);
}

export async function dbCreateMemory(
  supabase: SupabaseClient,
  userId: string,
  content: string,
  category: MemoryCategory,
  projectId?: string | null,
  agentId?: string | null,
) {
  const { data, error } = await supabase
    .from("memories")
    .insert({ user_id: userId, content, category, project_id: projectId ?? null, agent_id: agentId ?? null })
    .select(MEMORY_SELECT)
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function dbUpdateMemory(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  patch: { content?: string; category?: MemoryCategory },
) {
  const payload: Record<string, string> = {};
  if (patch.content !== undefined) payload.content = patch.content;
  if (patch.category !== undefined) payload.category = patch.category;
  const { data, error } = await supabase
    .from("memories")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select(MEMORY_SELECT)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Row) : null;
}

export async function dbDeleteMemory(supabase: SupabaseClient, userId: string, id: string) {
  const { error } = await supabase.from("memories").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function dbDeleteAllMemories(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("memories").delete().eq("user_id", userId);
  if (error) throw error;
}
