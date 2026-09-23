import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ownedRow } from "@/lib/projects/access";
import { isProjectIcon, type Project, type ProjectIcon } from "@/lib/projects/types";

type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  icon: string | null;
  favorite: boolean | null;
  created_at: string;
  updated_at: string;
};

function mapProject(row: ProjectRow): Project {
  const rawIcon = row.icon ?? "folder";
  const icon: ProjectIcon = isProjectIcon(rawIcon) ? rawIcon : "folder";
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? "",
    instructions: row.instructions ?? "",
    icon,
    favorite: Boolean(row.favorite),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT =
  "id, user_id, name, description, instructions, icon, favorite, created_at, updated_at";

export async function listProjects(
  supabase: SupabaseClient,
  userId: string,
  options?: { limit?: number; offset?: number },
) {
  const limit = Math.min(Math.max(options?.limit ?? 40, 1), 100);
  const offset = Math.max(options?.offset ?? 0, 0);
  const { data, error, count } = await supabase
    .from("projects")
    .select(SELECT, { count: "exact" })
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return {
    projects: ((data ?? []) as ProjectRow[]).map(mapProject),
    total: count ?? 0,
    limit,
    offset,
  };
}

export async function getProject(supabase: SupabaseClient, userId: string, projectId: string) {
  const { data, error } = await supabase.from("projects").select(SELECT).eq("id", projectId).maybeSingle();
  if (error) throw error;
  return ownedRow(data ? mapProject(data as ProjectRow) : null, userId);
}

export async function createProject(
  supabase: SupabaseClient,
  userId: string,
  input: { name: string; description?: string; instructions?: string; icon?: ProjectIcon },
) {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description ?? "",
      instructions: input.instructions ?? "",
      icon: input.icon ?? "folder",
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return mapProject(data as ProjectRow);
}

export async function updateProject(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  patch: Partial<Pick<Project, "name" | "description" | "instructions" | "icon" | "favorite">>,
) {
  const owned = await getProject(supabase, userId, projectId);
  if (!owned.ok) return owned;
  const payload: Record<string, string | boolean> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.instructions !== undefined) payload.instructions = patch.instructions;
  if (patch.icon !== undefined) payload.icon = patch.icon;
  if (patch.favorite !== undefined) payload.favorite = patch.favorite;
  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", projectId)
    .eq("user_id", userId)
    .select(SELECT)
    .single();
  if (error) throw error;
  return { ok: true as const, row: mapProject(data as ProjectRow) };
}

export async function deleteProject(supabase: SupabaseClient, userId: string, projectId: string) {
  const owned = await getProject(supabase, userId, projectId);
  if (!owned.ok) return owned;
  const { error } = await supabase.from("projects").delete().eq("id", projectId).eq("user_id", userId);
  if (error) throw error;
  return owned;
}

export async function listProjectConversations(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  options?: { limit?: number; offset?: number },
) {
  const owned = await getProject(supabase, userId, projectId);
  if (!owned.ok) return { ...owned, conversations: [] as { id: string; title: string; updatedAt: string }[], total: 0 };
  const limit = Math.min(Math.max(options?.limit ?? 40, 1), 100);
  const offset = Math.max(options?.offset ?? 0, 0);
  const { data, error, count } = await supabase
    .from("conversations")
    .select("id, title, updated_at", { count: "exact" })
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return {
    ok: true as const,
    conversations: (data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      updatedAt: row.updated_at as string,
    })),
    total: count ?? 0,
    limit,
    offset,
  };
}

export async function listProjectDocuments(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  options?: { limit?: number; offset?: number },
) {
  const owned = await getProject(supabase, userId, projectId);
  if (!owned.ok) {
    return { ...owned, documents: [] as { id: string; filename: string; byteSize: number; createdAt: string }[], total: 0 };
  }
  const limit = Math.min(Math.max(options?.limit ?? 40, 1), 100);
  const offset = Math.max(options?.offset ?? 0, 0);
  const { data, error, count } = await supabase
    .from("documents")
    .select("id, filename, byte_size, created_at", { count: "exact" })
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return {
    ok: true as const,
    documents: (data ?? []).map((row) => ({
      id: row.id as string,
      filename: row.filename as string,
      byteSize: Number(row.byte_size ?? 0),
      createdAt: row.created_at as string,
    })),
    total: count ?? 0,
    limit,
    offset,
  };
}
