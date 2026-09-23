import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ownedRow } from "@/lib/projects/access";
import {
  localCountTasksSince,
  localCreateTask,
  localGetTask,
  localListSteps,
  localListTasks,
  localSaveTask,
  localTaskStats,
} from "@/lib/tasks/local";
import {
  dbCountTasksSince,
  dbCreateTask,
  dbGetTask,
  dbListSteps,
  dbListTasks,
  dbSaveTask,
  dbTaskStats,
} from "@/lib/db/tasks";
import type { TaskKind, TaskRecord, TaskStatus, TaskStep } from "@/lib/tasks/types";

export async function listTasks(
  supabase: SupabaseClient | null,
  userId: string,
  options?: { projectId?: string | null; status?: TaskStatus; history?: boolean; limit?: number },
) {
  if (supabase) return dbListTasks(supabase, userId, options);
  return localListTasks(userId, options).slice(0, options?.limit ?? 40);
}

export async function getTask(supabase: SupabaseClient | null, userId: string, id: string) {
  if (supabase) return dbGetTask(supabase, userId, id);
  return ownedRow(localGetTask(userId, id), userId);
}

export async function listTaskSteps(supabase: SupabaseClient | null, userId: string, taskId: string) {
  const owned = await getTask(supabase, userId, taskId);
  if (!owned.ok) return owned;
  const rows = supabase ? await dbListSteps(supabase, taskId) : localListSteps(taskId);
  return { ok: true as const, row: owned.row, steps: rows };
}

export async function createTask(
  supabase: SupabaseClient | null,
  userId: string,
  input: {
    agentId: string;
    projectId?: string | null;
    title: string;
    prompt: string;
    kind: TaskKind;
    maxSteps: number;
  },
) {
  if (supabase) return dbCreateTask(supabase, userId, input);
  return localCreateTask(userId, input);
}

export async function saveTask(
  supabase: SupabaseClient | null,
  userId: string,
  id: string,
  patch: Partial<TaskRecord>,
  nextSteps?: TaskStep[],
) {
  if (supabase) return dbSaveTask(supabase, userId, id, patch, nextSteps);
  const next = localSaveTask(userId, id, patch, nextSteps);
  return ownedRow(next, userId);
}

export async function countTasksSince(supabase: SupabaseClient | null, userId: string, iso: string) {
  if (supabase) return dbCountTasksSince(supabase, userId, iso);
  return localCountTasksSince(userId, iso);
}

export async function taskStats(supabase: SupabaseClient | null, userId: string) {
  if (supabase) return dbTaskStats(supabase, userId);
  return localTaskStats(userId);
}
