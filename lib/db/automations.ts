import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ownedRow } from "@/lib/projects/access";
import { computeNextRunAt, isScheduleType, type AutomationRecord, type ScheduleType } from "@/lib/automations/schedule";

type Row = {
  id: string;
  user_id: string;
  agent_id: string;
  project_id: string | null;
  name: string;
  prompt: string;
  enabled: boolean | null;
  schedule_enabled: boolean | null;
  schedule_type: string;
  schedule_value: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: string | null;
  created_at: string;
  updated_at: string;
};

const SELECT =
  "id, user_id, agent_id, project_id, name, prompt, enabled, schedule_enabled, schedule_type, schedule_value, next_run_at, last_run_at, last_status, created_at, updated_at";

function mapRow(row: Row): AutomationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    agentId: row.agent_id,
    projectId: row.project_id,
    name: row.name,
    prompt: row.prompt,
    enabled: row.enabled !== false,
    scheduleEnabled: Boolean(row.schedule_enabled),
    scheduleType: isScheduleType(row.schedule_type) ? row.schedule_type : "once",
    scheduleValue: row.schedule_value ?? "",
    nextRunAt: row.next_run_at,
    lastRunAt: row.last_run_at,
    lastStatus: row.last_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function dbListAutomations(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from("automations").select(SELECT).eq("user_id", userId).order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Row[]).map(mapRow);
}

export async function dbGetAutomation(supabase: SupabaseClient, userId: string, id: string) {
  const { data, error } = await supabase.from("automations").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return ownedRow(data ? mapRow(data as Row) : null, userId);
}

export async function dbCreateAutomation(
  supabase: SupabaseClient,
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
  const { data, error } = await supabase
    .from("automations")
    .insert({
      user_id: userId,
      agent_id: input.agentId,
      project_id: input.projectId ?? null,
      name: input.name.slice(0, 80),
      prompt: input.prompt.slice(0, 8_000),
      enabled: input.enabled !== false,
      schedule_enabled: Boolean(input.scheduleEnabled),
      schedule_type: input.scheduleType,
      schedule_value: input.scheduleValue ?? "",
      next_run_at:
        input.nextRunAt ??
        (input.scheduleEnabled ? computeNextRunAt(input.scheduleType, input.scheduleValue ?? "") : null),
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function dbUpdateAutomation(supabase: SupabaseClient, userId: string, id: string, patch: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};
  if (typeof patch.name === "string") payload.name = patch.name;
  if (typeof patch.prompt === "string") payload.prompt = patch.prompt;
  if (typeof patch.enabled === "boolean") payload.enabled = patch.enabled;
  if (typeof patch.scheduleEnabled === "boolean") payload.schedule_enabled = patch.scheduleEnabled;
  if (typeof patch.scheduleType === "string") payload.schedule_type = patch.scheduleType;
  if (typeof patch.scheduleValue === "string") payload.schedule_value = patch.scheduleValue;
  if ("nextRunAt" in patch) payload.next_run_at = patch.nextRunAt ?? null;
  if ("projectId" in patch) payload.project_id = patch.projectId ?? null;
  if (typeof patch.lastRunAt === "string") payload.last_run_at = patch.lastRunAt;
  if (typeof patch.lastStatus === "string") payload.last_status = patch.lastStatus;
  const { data, error } = await supabase.from("automations").update(payload).eq("id", id).eq("user_id", userId).select(SELECT).maybeSingle();
  if (error) throw error;
  return ownedRow(data ? mapRow(data as Row) : null, userId);
}

export async function dbDeleteAutomation(supabase: SupabaseClient, userId: string, id: string) {
  const owned = await dbGetAutomation(supabase, userId, id);
  if (!owned.ok) return owned;
  const { error } = await supabase.from("automations").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
  return { ok: true as const, row: owned.row };
}
