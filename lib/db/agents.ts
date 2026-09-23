import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentDefinition, AgentIcon, AgentToolId } from "@/lib/agents/types";
import { isAgentIcon, isAgentToolId } from "@/lib/agents/types";
import { DEFAULT_MODEL_ID, type AiModelId } from "@/lib/ai/models";
import { isAllowedModelId } from "@/lib/ai/config";
import { ownedRow } from "@/lib/projects/access";

type Row = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  instructions: string | null;
  allowed_tools: string[] | null;
  model: string | null;
  enabled: boolean | null;
  project_id: string | null;
  published: boolean | null;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
};

const SELECT =
  "id, user_id, name, description, icon, instructions, allowed_tools, model, enabled, project_id, published, public_slug, created_at, updated_at";

function mapRow(row: Row): AgentDefinition {
  const tools = Array.isArray(row.allowed_tools) ? row.allowed_tools.filter(isAgentToolId) : [];
  const icon: AgentIcon = row.icon && isAgentIcon(row.icon) ? row.icon : "sparkles";
  const model: AiModelId = row.model && isAllowedModelId(row.model) ? row.model : DEFAULT_MODEL_ID;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? "",
    icon,
    instructions: row.instructions ?? "",
    allowedTools: tools,
    model,
    minPlan: "free",
    enabled: row.enabled !== false,
    source: "custom",
    projectId: row.project_id ?? null,
    published: Boolean(row.published),
    publicSlug: row.public_slug ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function dbListAgents(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("agents")
    .select(SELECT)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Row[]).map(mapRow);
}

export async function dbGetAgent(supabase: SupabaseClient, userId: string, id: string) {
  const { data, error } = await supabase.from("agents").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return ownedRow(data ? mapRow(data as Row) : null, userId);
}

export async function dbCreateAgent(
  supabase: SupabaseClient,
  userId: string,
  input: {
    name: string;
    description?: string;
    icon?: AgentIcon;
    instructions?: string;
    allowedTools?: AgentToolId[];
    model?: AiModelId;
    enabled?: boolean;
    projectId?: string | null;
    published?: boolean;
    publicSlug?: string | null;
  },
) {
  const { data, error } = await supabase
    .from("agents")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description ?? "",
      icon: input.icon ?? "sparkles",
      instructions: input.instructions ?? "",
      allowed_tools: input.allowedTools ?? [],
      model: input.model ?? DEFAULT_MODEL_ID,
      enabled: input.enabled !== false,
      project_id: input.projectId ?? null,
      published: Boolean(input.published),
      public_slug: input.publicSlug ?? null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function dbUpdateAgent(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  patch: Record<string, unknown>,
) {
  const owned = await dbGetAgent(supabase, userId, id);
  if (!owned.ok) return owned;
  const payload: Record<string, unknown> = {};
  if (typeof patch.name === "string") payload.name = patch.name;
  if (typeof patch.description === "string") payload.description = patch.description;
  if (typeof patch.icon === "string") payload.icon = patch.icon;
  if (typeof patch.instructions === "string") payload.instructions = patch.instructions;
  if (Array.isArray(patch.allowedTools)) payload.allowed_tools = patch.allowedTools;
  if (typeof patch.model === "string") payload.model = patch.model;
  if (typeof patch.enabled === "boolean") payload.enabled = patch.enabled;
  if ("projectId" in patch) payload.project_id = patch.projectId ?? null;
  if (typeof patch.published === "boolean") payload.published = patch.published;
  if ("publicSlug" in patch) payload.public_slug = patch.publicSlug ?? null;
  const { data, error } = await supabase.from("agents").update(payload).eq("id", id).eq("user_id", userId).select(SELECT).maybeSingle();
  if (error) throw error;
  return ownedRow(data ? mapRow(data as Row) : null, userId);
}

export async function dbDeleteAgent(supabase: SupabaseClient, userId: string, id: string) {
  const owned = await dbGetAgent(supabase, userId, id);
  if (!owned.ok) return owned;
  const { error } = await supabase.from("agents").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
  return { ok: true as const, row: owned.row };
}

export async function dbGetPublishedAgent(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from("agents")
    .select(SELECT)
    .eq("public_slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Row) : null;
}
