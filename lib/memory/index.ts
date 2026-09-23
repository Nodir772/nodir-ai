import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  dbCreateMemory,
  dbDeleteAllMemories,
  dbDeleteMemory,
  dbGetMemories,
  dbUpdateMemory,
} from "@/lib/db/memories";
import {
  localCreate,
  localDelete,
  localDeleteAll,
  localList,
  localUpdate,
} from "@/lib/memory/local";
import { isSensitiveMemory, SENSITIVE_MEMORY_ERROR } from "@/lib/memory/sensitive";
import { isMemoryCategory, type Memory, type MemoryCategory } from "@/lib/memory/types";

export type MemoryWriteResult =
  | { ok: true; memory: Memory }
  | { ok: false; error: string; status: number };

export async function getMemories(
  supabase: SupabaseClient | null,
  userId: string,
  options?: { projectId?: string | null; agentId?: string | null },
): Promise<Memory[]> {
  if (supabase) return dbGetMemories(supabase, userId, options);
  return localList(userId, options);
}

export async function createMemory(
  supabase: SupabaseClient | null,
  userId: string,
  content: string,
  category: string,
  projectId?: string | null,
  agentId?: string | null,
): Promise<MemoryWriteResult> {
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 500) {
    return { ok: false, error: "Xotira matni 1–500 belgi oralig'ida bo'lishi kerak.", status: 400 };
  }
  if (isSensitiveMemory(trimmed)) {
    return { ok: false, error: SENSITIVE_MEMORY_ERROR, status: 400 };
  }
  const resolved: MemoryCategory = isMemoryCategory(category) ? category : "general";
  const memory = supabase
    ? await dbCreateMemory(supabase, userId, trimmed, resolved, projectId, agentId)
    : localCreate(userId, trimmed, resolved, projectId, agentId);
  return { ok: true, memory };
}

export async function updateMemory(
  supabase: SupabaseClient | null,
  userId: string,
  id: string,
  patch: { content?: string; category?: string },
): Promise<MemoryWriteResult | { ok: false; error: string; status: number }> {
  const next: { content?: string; category?: MemoryCategory } = {};
  if (patch.content !== undefined) {
    const trimmed = patch.content.trim();
    if (!trimmed || trimmed.length > 500) {
      return { ok: false, error: "Xotira matni 1–500 belgi oralig'ida bo'lishi kerak.", status: 400 };
    }
    if (isSensitiveMemory(trimmed)) {
      return { ok: false, error: SENSITIVE_MEMORY_ERROR, status: 400 };
    }
    next.content = trimmed;
  }
  if (patch.category !== undefined) {
    if (!isMemoryCategory(patch.category)) {
      return { ok: false, error: "Noto'g'ri toifa.", status: 400 };
    }
    next.category = patch.category;
  }
  const memory = supabase
    ? await dbUpdateMemory(supabase, userId, id, next)
    : localUpdate(userId, id, next);
  if (!memory) return { ok: false, error: "Xotira topilmadi.", status: 404 };
  return { ok: true, memory };
}

export async function deleteMemory(supabase: SupabaseClient | null, userId: string, id: string) {
  if (supabase) await dbDeleteMemory(supabase, userId, id);
  else localDelete(userId, id);
}

export async function deleteAllMemories(supabase: SupabaseClient | null, userId: string) {
  if (supabase) await dbDeleteAllMemories(supabase, userId);
  else localDeleteAll(userId);
}
