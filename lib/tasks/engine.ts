import { randomUUID } from "node:crypto";
import type { AgentDefinition, AgentToolId } from "@/lib/agents/types";
import { isAgentToolId } from "@/lib/agents/types";
import { agentAllowsTool } from "@/lib/agents/tools";
import { agentLimitsFor } from "@/lib/agents/limits";
import type { PlanId } from "@/lib/billing/plans";
import { buildStepsForKind } from "@/lib/tasks/steps";
import {
  shouldStopStatus,
  type PlannedStep,
  type TaskKind,
  type TaskRecord,
  type TaskStep,
} from "@/lib/tasks/types";

export type TaskLimits = {
  maxStepsPerTask: number;
  maxToolCallsPerTask: number;
  maxTaskDurationMs: number;
};

export function limitsForPlan(plan: PlanId | string | null | undefined): TaskLimits {
  return agentLimitsFor(plan);
}

export function planTaskSteps(kind: TaskKind, maxSteps: number): PlannedStep[] {
  return buildStepsForKind(kind).slice(0, Math.max(1, maxSteps));
}

export function stepsForRetry(steps: TaskStep[]): TaskStep[] {
  return steps.map((step) =>
    step.status === "completed" || step.status === "skipped"
      ? step
      : { ...step, status: "pending", output: "", error: null, startedAt: null, finishedAt: null },
  );
}

export function remainingRunnableSteps(steps: TaskStep[]) {
  return steps.filter((step) => step.status !== "completed" && step.status !== "skipped");
}

export type StepExecutor = (input: {
  step: PlannedStep;
  task: TaskRecord;
  prior: TaskStep[];
}) => Promise<{
  text: string;
  skipped?: boolean;
  sources?: TaskRecord["sources"];
  files?: TaskRecord["files"];
  tool?: string | null;
}>;

export type TaskEngineDeps = {
  load: () => Promise<TaskRecord>;
  save: (patch: Partial<TaskRecord>, steps?: TaskStep[]) => Promise<void>;
  executeStep: StepExecutor;
  now?: () => number;
  allowedTools: AgentToolId[];
};

export async function runBoundedTask(options: {
  task: TaskRecord;
  steps: TaskStep[];
  planned: PlannedStep[];
  limits: TaskLimits;
  deps: TaskEngineDeps;
}): Promise<{ task: TaskRecord; steps: TaskStep[] }> {
  const now = options.deps.now ?? Date.now;
  const started = now();
  let task: TaskRecord = {
    ...options.task,
    status: "running",
    startedAt: options.task.startedAt ?? new Date(started).toISOString(),
    error: null,
  };
  const steps = options.steps.map((step) => ({ ...step }));
  await options.deps.save({ status: "running", startedAt: task.startedAt, error: null }, steps);

  for (let index = 0; index < options.planned.length; index += 1) {
    const planned = options.planned[index]!;
    const existing = steps[index];
    if (existing && (existing.status === "completed" || existing.status === "skipped")) {
      continue;
    }

    const latest = await options.deps.load();
    if (shouldStopStatus(latest.status)) {
      task = { ...task, status: latest.status };
      break;
    }
    if (now() - started > options.limits.maxTaskDurationMs) {
      task = { ...task, status: "failed", error: "Vaqt limiti tugadi." };
      break;
    }
    if (index >= options.limits.maxStepsPerTask) {
      task = { ...task, status: "failed", error: "Qadamlar limiti tugadi." };
      break;
    }

    const tool = planned.tool && isAgentToolId(planned.tool) ? planned.tool : null;
    if (tool && !agentAllowsTool(options.deps.allowedTools, tool)) {
      steps[index] = {
        id: existing?.id ?? randomUUID(),
        taskId: task.id,
        index,
        key: planned.key,
        label: planned.label,
        status: "skipped",
        tool,
        output: "Bu vosita agentda yoqilmagan — qadam o'tkazib yuborildi.",
        error: null,
        startedAt: new Date(now()).toISOString(),
        finishedAt: new Date(now()).toISOString(),
      };
      task.currentStep = index + 1;
      await options.deps.save({ currentStep: task.currentStep }, steps);
      continue;
    }
    if (tool && task.toolCalls >= options.limits.maxToolCallsPerTask) {
      task = { ...task, status: "failed", error: "Vosita chaqiruvlari limiti tugadi." };
      break;
    }

    const runningStep: TaskStep = {
      id: existing?.id ?? randomUUID(),
      taskId: task.id,
      index,
      key: planned.key,
      label: planned.label,
      status: "running",
      tool,
      output: "",
      error: null,
      startedAt: new Date(now()).toISOString(),
      finishedAt: null,
    };
    steps[index] = runningStep;
    task.currentStep = index + 1;
    await options.deps.save({ status: "running", currentStep: task.currentStep }, steps);

    try {
      const result = await options.deps.executeStep({ step: planned, task, prior: steps });
      if (tool && !result.skipped) task.toolCalls += 1;
      if (result.sources?.length) task.sources = mergeSources(task.sources, result.sources);
      if (result.files?.length) task.files = mergeFiles(task.files, result.files);
      if (result.tool) {
        if (!task.toolsUsed.includes(result.tool)) task.toolsUsed = [...task.toolsUsed, result.tool];
      } else if (tool && !result.skipped && !task.toolsUsed.includes(tool)) {
        task.toolsUsed = [...task.toolsUsed, tool];
      }
      steps[index] = {
        ...runningStep,
        status: result.skipped ? "skipped" : "completed",
        output: result.text.slice(0, 12_000),
        finishedAt: new Date(now()).toISOString(),
      };
      await options.deps.save(
        { currentStep: task.currentStep, toolCalls: task.toolCalls, sources: task.sources, files: task.files, toolsUsed: task.toolsUsed },
        steps,
      );
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Qadam bajarilmadi.";
      steps[index] = {
        ...runningStep,
        status: "failed",
        error: message,
        finishedAt: new Date(now()).toISOString(),
      };
      task = { ...task, status: "failed", error: message };
      break;
    }
  }

  const durationMs = now() - started;
  if (task.status === "running") {
    const lastCompleted = [...steps].reverse().find((step) => step.status === "completed");
    task = {
      ...task,
      status: "completed",
      summary: summarizeTask(steps),
      result: lastCompleted?.output ?? task.result,
      finishedAt: new Date(now()).toISOString(),
      durationMs,
    };
  } else {
    task = { ...task, finishedAt: new Date(now()).toISOString(), durationMs };
  }
  await options.deps.save(
    {
      status: task.status,
      summary: task.summary,
      result: task.result,
      error: task.error,
      finishedAt: task.finishedAt,
      durationMs: task.durationMs,
      toolCalls: task.toolCalls,
      toolsUsed: task.toolsUsed,
      sources: task.sources,
      files: task.files,
      currentStep: task.currentStep,
    },
    steps,
  );
  return { task, steps };
}

export function summarizeTask(steps: TaskStep[]) {
  const done = steps.filter((step) => step.status === "completed").length;
  return `${done}/${steps.length} qadam yakunlandi.`;
}

function mergeSources(current: TaskRecord["sources"], extra: TaskRecord["sources"]) {
  const seen = new Set(current.map((item) => item.url));
  const next = [...current];
  for (const item of extra) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    next.push(item);
  }
  return next.slice(0, 12);
}

function mergeFiles(current: TaskRecord["files"], extra: TaskRecord["files"]) {
  const seen = new Set(current.map((item) => item.id));
  const next = [...current];
  for (const item of extra) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    next.push(item);
  }
  return next.slice(0, 12);
}

export function agentHasRequiredTools(agent: AgentDefinition, kind: TaskKind) {
  const planned = buildStepsForKind(kind);
  return planned.some((step) => !step.tool || agentAllowsTool(agent.allowedTools, step.tool as AgentToolId));
}
