import { randomUUID } from "node:crypto";
import { planTaskSteps } from "@/lib/tasks/engine";
import type { TaskKind, TaskRecord, TaskStatus, TaskStep } from "@/lib/tasks/types";

const tasks = new Map<string, TaskRecord[]>();
const steps = new Map<string, TaskStep[]>();

export function localListTasks(
  userId: string,
  options?: { projectId?: string | null; status?: TaskStatus; history?: boolean },
) {
  let list = [...(tasks.get(userId) ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (options?.projectId) list = list.filter((item) => item.projectId === options.projectId);
  if (options?.status) list = list.filter((item) => item.status === options.status);
  if (options?.history) list = list.filter((item) => item.status === "completed" || item.status === "failed" || item.status === "cancelled");
  return list;
}

export function localGetTask(userId: string, id: string) {
  return localListTasks(userId).find((item) => item.id === id) ?? null;
}

export function localListSteps(taskId: string) {
  return [...(steps.get(taskId) ?? [])].sort((a, b) => a.index - b.index);
}

export function localCreateTask(
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
  const now = new Date().toISOString();
  const planned = planTaskSteps(input.kind, input.maxSteps);
  const task: TaskRecord = {
    id: randomUUID(),
    userId,
    agentId: input.agentId,
    projectId: input.projectId ?? null,
    title: input.title.slice(0, 120),
    input: input.prompt.slice(0, 8_000),
    kind: input.kind,
    status: "pending",
    summary: "",
    result: "",
    sources: [],
    files: [],
    toolsUsed: [],
    currentStep: 0,
    stepCount: planned.length,
    toolCalls: 0,
    retryCount: 0,
    error: null,
    startedAt: null,
    finishedAt: null,
    durationMs: null,
    createdAt: now,
    updatedAt: now,
  };
  const taskSteps: TaskStep[] = planned.map((step, index) => ({
    id: randomUUID(),
    taskId: task.id,
    index,
    key: step.key,
    label: step.label,
    status: "pending",
    tool: step.tool,
    output: "",
    error: null,
    startedAt: null,
    finishedAt: null,
  }));
  tasks.set(userId, [task, ...localListTasks(userId)]);
  steps.set(task.id, taskSteps);
  return { task, steps: taskSteps };
}

export function localSaveTask(userId: string, id: string, patch: Partial<TaskRecord>, nextSteps?: TaskStep[]) {
  const list = localListTasks(userId);
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const updated = { ...list[index]!, ...patch, updatedAt: new Date().toISOString() };
  list[index] = updated;
  tasks.set(userId, list);
  if (nextSteps) steps.set(id, nextSteps);
  return updated;
}

export function localCountTasksSince(userId: string, iso: string) {
  return localListTasks(userId).filter((item) => item.createdAt >= iso).length;
}

export function localTaskStats(userId: string) {
  const list = localListTasks(userId);
  return {
    running: list.filter((item) => item.status === "running").length,
    completed: list.filter((item) => item.status === "completed").length,
    failed: list.filter((item) => item.status === "failed").length,
  };
}

export function resetLocalTasks() {
  tasks.clear();
  steps.clear();
}
