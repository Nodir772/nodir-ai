import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ownedRow } from "@/lib/projects/access";
import type { AutomationRecord, ScheduleType } from "@/lib/automations/schedule";
import {
  localCreateAutomation,
  localDeleteAutomation,
  localGetAutomation,
  localListAutomations,
  localUpdateAutomation,
} from "@/lib/automations/local";
import {
  dbCreateAutomation,
  dbDeleteAutomation,
  dbGetAutomation,
  dbListAutomations,
  dbUpdateAutomation,
} from "@/lib/db/automations";

export async function listAutomations(supabase: SupabaseClient | null, userId: string) {
  if (supabase) return dbListAutomations(supabase, userId);
  return localListAutomations(userId);
}

export async function getAutomation(supabase: SupabaseClient | null, userId: string, id: string) {
  if (supabase) return dbGetAutomation(supabase, userId, id);
  return ownedRow(localGetAutomation(userId, id), userId);
}

export async function createAutomation(
  supabase: SupabaseClient | null,
  userId: string,
  input: {
    agentId: string;
    projectId?: string | null;
    name: string;
    prompt: string;
    enabled?: boolean;
    scheduleEnabled?: boolean;
    scheduleType: ScheduleType;
    scheduleValue?: string;
    nextRunAt?: string | null;
  },
) {
  if (supabase) return dbCreateAutomation(supabase, userId, input);
  return localCreateAutomation(userId, input);
}

export async function updateAutomation(
  supabase: SupabaseClient | null,
  userId: string,
  id: string,
  patch: Partial<AutomationRecord> & { scheduleEnabled?: boolean; scheduleType?: ScheduleType; scheduleValue?: string },
) {
  if (supabase) return dbUpdateAutomation(supabase, userId, id, patch);
  const next = localUpdateAutomation(userId, id, patch);
  return ownedRow(next, userId);
}

export async function deleteAutomation(supabase: SupabaseClient | null, userId: string, id: string) {
  if (supabase) return dbDeleteAutomation(supabase, userId, id);
  const existing = localGetAutomation(userId, id);
  const owned = ownedRow(existing, userId);
  if (!owned.ok) return owned;
  localDeleteAutomation(userId, id);
  return { ok: true as const, row: owned.row };
}
