import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ownedRow } from "@/lib/projects/access";
import { isTaskKind, isTaskStatus, type TaskKind, type TaskRecord, type TaskStatus, type TaskStep } from "@/lib/tasks/types";
import { planTaskSteps } from "@/lib/tasks/engine";

type TaskRow = {
  id: string;
  user_id: string;
  agent_id: string;
  project_id: string | null;
  title: string;
  input: string;
  kind: string;
  status: string;
  summary: string | null;
  result: string | null;
  sources: TaskRecord["sources"] | null;
  files: TaskRecord["files"] | null;
  tools_used: string[] | null;
  current_step: number | null;
  step_count: number | null;
  tool_calls: number | null;
  retry_count: number | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  created_at: string;
  updated_at: string;
};

type StepRow = {
  id: string;
  task_id: string;
  step_index: number;
  key: string;
  label: string;
  status: string;
  tool: string | null;
  output: string | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
};

const TASK_SELECT =
  "id, user_id, agent_id, project_id, title, input, kind, status, summary, result, sources, files, tools_used, current_step, step_count, tool_calls, retry_count, error, started_at, finished_at, duration_ms, created_at, updated_at";

function mapTask(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    userId: row.user_id,
    agentId: row.agent_id,
    projectId: row.project_id,
    title: row.title,
    input: row.input,
    kind: isTaskKind(row.kind) ? row.kind : "general",
    status: isTaskStatus(row.status) ? row.status : "pending",
    summary: row.summary ?? "",
    result: row.result ?? "",
    sources: Array.isArray(row.sources) ? row.sources : [],
    files: Array.isArray(row.files) ? row.files : [],
    toolsUsed: Array.isArray(row.tools_used) ? row.tools_used : [],
    currentStep: row.current_step ?? 0,
    stepCount: row.step_count ?? 0,
    toolCalls: row.tool_calls ?? 0,
    retryCount: row.retry_count ?? 0,
    error: row.error,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStep(row: StepRow): TaskStep {
  return {
    id: row.id,
    taskId: row.task_id,
    index: row.step_index,
    key: row.key,
    label: row.label,
    status: (row.status as TaskStep["status"]) ?? "pending",
    tool: row.tool,
    output: row.output ?? "",
    error: row.error,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export async function dbListTasks(
  supabase: SupabaseClient,
  userId: string,
  options?: { projectId?: string | null; status?: TaskStatus; history?: boolean; limit?: number },
) {
  const limit = Math.min(Math.max(options?.limit ?? 40, 1), 100);
  let query = supabase.from("tasks").select(TASK_SELECT).eq("user_id", userId).order("updated_at", { ascending: false }).limit(limit);
  if (options?.projectId) query = query.eq("project_id", options.projectId);
  if (options?.status) query = query.eq("status", options.status);
  if (options?.history) query = query.in("status", ["completed", "failed", "cancelled"]);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as TaskRow[]).map(mapTask);
}

export async function dbGetTask(supabase: SupabaseClient, userId: string, id: string) {
  const { data, error } = await supabase.from("tasks").select(TASK_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return ownedRow(data ? mapTask(data as TaskRow) : null, userId);
}

export async function dbListSteps(supabase: SupabaseClient, taskId: string) {
  const { data, error } = await supabase
    .from("task_steps")
    .select("id, task_id, step_index, key, label, status, tool, output, error, started_at, finished_at")
    .eq("task_id", taskId)
    .order("step_index", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as StepRow[]).map(mapStep);
}

export async function dbCreateTask(
  supabase: SupabaseClient,
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
  const planned = planTaskSteps(input.kind, input.maxSteps);
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      agent_id: input.agentId,
      project_id: input.projectId ?? null,
      title: input.title.slice(0, 120),
      input: input.prompt.slice(0, 8_000),
      kind: input.kind,
      status: "pending",
      step_count: planned.length,
    })
    .select(TASK_SELECT)
    .single();
  if (error) throw error;
  const task = mapTask(data as TaskRow);
  const { data: stepRows, error: stepError } = await supabase
    .from("task_steps")
    .insert(
      planned.map((step, index) => ({
        task_id: task.id,
        step_index: index,
        key: step.key,
        label: step.label,
        status: "pending",
        tool: step.tool,
      })),
    )
    .select("id, task_id, step_index, key, label, status, tool, output, error, started_at, finished_at");
  if (stepError) throw stepError;
  return { task, steps: ((stepRows ?? []) as StepRow[]).map(mapStep) };
}

export async function dbSaveTask(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  patch: Partial<TaskRecord>,
  nextSteps?: TaskStep[],
) {
  const payload: Record<string, unknown> = {};
  if (patch.status) payload.status = patch.status;
  if (patch.summary !== undefined) payload.summary = patch.summary;
  if (patch.result !== undefined) payload.result = patch.result;
  if (patch.sources) payload.sources = patch.sources;
  if (patch.files) payload.files = patch.files;
  if (patch.toolsUsed) payload.tools_used = patch.toolsUsed;
  if (patch.currentStep !== undefined) payload.current_step = patch.currentStep;
  if (patch.stepCount !== undefined) payload.step_count = patch.stepCount;
  if (patch.toolCalls !== undefined) payload.tool_calls = patch.toolCalls;
  if (patch.retryCount !== undefined) payload.retry_count = patch.retryCount;
  if (patch.error !== undefined) payload.error = patch.error;
  if (patch.startedAt !== undefined) payload.started_at = patch.startedAt;
  if (patch.finishedAt !== undefined) payload.finished_at = patch.finishedAt;
  if (patch.durationMs !== undefined) payload.duration_ms = patch.durationMs;
  const { data, error } = await supabase.from("tasks").update(payload).eq("id", id).eq("user_id", userId).select(TASK_SELECT).maybeSingle();
  if (error) throw error;
  if (nextSteps) {
    for (const step of nextSteps) {
      await supabase
        .from("task_steps")
        .update({
          status: step.status,
          output: step.output,
          error: step.error,
          tool: step.tool,
          started_at: step.startedAt,
          finished_at: step.finishedAt,
        })
        .eq("id", step.id)
        .eq("task_id", id);
    }
  }
  return ownedRow(data ? mapTask(data as TaskRow) : null, userId);
}

export async function dbCountTasksSince(supabase: SupabaseClient, userId: string, iso: string) {
  const { count, error } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", iso);
  if (error) throw error;
  return count ?? 0;
}

export async function dbTaskStats(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from("tasks").select("status").eq("user_id", userId);
  if (error) throw error;
  const list = data ?? [];
  return {
    running: list.filter((row) => row.status === "running").length,
    completed: list.filter((row) => row.status === "completed").length,
    failed: list.filter((row) => row.status === "failed").length,
  };
}
