import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentDefinition, AgentIcon, AgentToolId } from "@/lib/agents/types";
import { getBuiltinAgent } from "@/lib/agents/catalog";
import {
  localCreateAgent,
  localDeleteAgent,
  localFindPublished,
  localGetAgent,
  localListAgents,
  localUpdateAgent,
} from "@/lib/agents/local";
import {
  dbCreateAgent,
  dbDeleteAgent,
  dbGetAgent,
  dbGetPublishedAgent,
  dbListAgents,
  dbUpdateAgent,
} from "@/lib/db/agents";
import { ownedRow } from "@/lib/projects/access";
import type { AiModelId } from "@/lib/ai/models";

export async function listCustomAgents(supabase: SupabaseClient | null, userId: string) {
  if (supabase) return dbListAgents(supabase, userId);
  return localListAgents(userId);
}

export async function getCustomAgent(supabase: SupabaseClient | null, userId: string, id: string) {
  if (supabase) return dbGetAgent(supabase, userId, id);
  return ownedRow(localGetAgent(userId, id), userId);
}

export async function createCustomAgent(
  supabase: SupabaseClient | null,
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
  if (supabase) return dbCreateAgent(supabase, userId, input);
  return localCreateAgent(userId, input);
}

export async function updateCustomAgent(
  supabase: SupabaseClient | null,
  userId: string,
  id: string,
  patch: Partial<
    Pick<
      AgentDefinition,
      "name" | "description" | "icon" | "instructions" | "allowedTools" | "model" | "enabled" | "projectId" | "published" | "publicSlug"
    >
  >,
) {
  if (supabase) return dbUpdateAgent(supabase, userId, id, patch);
  const next = localUpdateAgent(userId, id, patch);
  return ownedRow(next, userId);
}

export async function deleteCustomAgent(supabase: SupabaseClient | null, userId: string, id: string) {
  if (supabase) return dbDeleteAgent(supabase, userId, id);
  const existing = localGetAgent(userId, id);
  const owned = ownedRow(existing, userId);
  if (!owned.ok) return owned;
  localDeleteAgent(userId, id);
  return { ok: true as const, row: owned.row };
}

export async function getPublishedAgent(supabase: SupabaseClient | null, slug: string) {
  const builtin = getBuiltinAgent(slug);
  if (builtin) return builtin;
  if (supabase) return dbGetPublishedAgent(supabase, slug);
  return localFindPublished(slug);
}

export async function resolveStoredAgent(supabase: SupabaseClient | null, userId: string, id: string) {
  const builtin = getBuiltinAgent(id);
  if (builtin) return { ok: true as const, agent: builtin, builtin: true as const };
  const custom = await getCustomAgent(supabase, userId, id);
  if (!custom.ok) return custom;
  return { ok: true as const, agent: custom.row, builtin: false as const };
}
