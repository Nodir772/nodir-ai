import "server-only";

import type { RequestIdentity } from "@/lib/auth/request-user";
import type { AgentDefinition } from "@/lib/agents/types";
import { isAgentToolId } from "@/lib/agents/types";
import { executeAgentTool } from "@/lib/agents/execute-tool";
import { composeAgentSystem } from "@/lib/agents/compose";
import { loadProjectChatContext } from "@/lib/projects/context";
import { wrapUntrustedData } from "@/lib/search/untrusted";
import { limitsForPlan, planTaskSteps, runBoundedTask, stepsForRetry } from "@/lib/tasks/engine";
import { getTask, listTaskSteps, saveTask } from "@/lib/tasks/store";
import type { TaskRecord, TaskStep } from "@/lib/tasks/types";
import { trackTaskEvent } from "@/lib/observability/monitor";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function executeStoredTask(options: {
  request: Request;
  identity: RequestIdentity;
  supabase: SupabaseClient | null;
  taskId: string;
  agent: AgentDefinition;
  retry?: boolean;
}) {
  const owned = await getTask(options.supabase, options.identity.id, options.taskId);
  if (!owned.ok) return owned;
  let task = owned.row;
  const loaded = await listTaskSteps(options.supabase, options.identity.id, options.taskId);
  if (!loaded.ok) return loaded;
  let steps: TaskStep[] = loaded.steps;
  if (options.retry) {
    steps = stepsForRetry(steps);
    const saved = await saveTask(
      options.supabase,
      options.identity.id,
      task.id,
      { status: "pending", error: null, retryCount: task.retryCount + 1, finishedAt: null },
      steps,
    );
    if (!saved.ok) return saved;
    task = saved.row;
  }
  if (task.status === "cancelled") {
    return { ok: true as const, task, steps };
  }

  const limits = limitsForPlan(options.identity.plan);
  const planned = planTaskSteps(task.kind, limits.maxStepsPerTask);

  let projectExtra = "";
  if (task.projectId && options.supabase) {
    const project = await loadProjectChatContext({
      supabase: options.supabase,
      userId: options.identity.id,
      projectId: task.projectId,
      query: task.input,
    });
    if (project.extra) projectExtra = wrapUntrustedData("PROJECT_CONTEXT", project.extra);
  }

  const started = Date.now();
  const result = await runBoundedTask({
    task,
    steps,
    planned,
    limits,
    deps: {
      allowedTools: options.agent.allowedTools,
      load: async () => {
        const latest = await getTask(options.supabase, options.identity.id, task.id);
        return latest.ok ? latest.row : task;
      },
      save: async (patch, nextSteps) => {
        const saved = await saveTask(options.supabase, options.identity.id, task.id, patch, nextSteps);
        if (saved.ok) task = saved.row;
      },
      executeStep: async ({ step, prior }) => {
        const context = [
          `Task: ${task.title}`,
          `User request:\n${task.input}`,
          projectExtra,
          prior
            .filter((item) => item.status === "completed" && item.output)
            .map((item) => `Previous step (${item.label}):\n${item.output.slice(0, 4_000)}`)
            .join("\n\n"),
        ]
          .filter(Boolean)
          .join("\n\n");

        if (!step.tool) {
          const sources = task.sources
            .map((item) => `${item.title} — ${item.url}`)
            .join("\n");
          return {
            text: sources ? wrapUntrustedData("SOURCES", sources) : "Manba topilmadi.",
            skipped: false,
            tool: null,
          };
        }

        if (step.tool === "web_search" || step.tool === "documents" || step.tool === "image") {
          const executed = await executeAgentTool({
            request: options.request,
            identity: options.identity,
            agent: options.agent,
            tool: step.tool,
            input: `${task.input}\n\n${context}`,
            supabase: options.supabase,
            extraSystem: projectExtra,
          });
          if (!executed.ok) {
            const json = (await executed.response.json().catch(() => ({ error: "Vosita bajarilmadi." }))) as { error?: string };
            throw new Error(json.error ?? "Vosita bajarilmadi.");
          }
          return {
            text: executed.text,
            sources: executed.sources,
            files: executed.files,
            tool: step.tool,
          };
        }

        if (!isAgentToolId(step.tool)) {
          throw new Error("Noto'g'ri vosita.");
        }

        const executed = await executeAgentTool({
          request: options.request,
          identity: options.identity,
          agent: options.agent,
          tool: step.tool,
          input: context,
          supabase: options.supabase,
          extraSystem: composeAgentSystem({
            catalogInstructions: options.agent.instructions,
            extras: [projectExtra, `Current observable step: ${step.label}. Do not claim you executed code.`],
          }),
        });
        if (!executed.ok) {
          const json = (await executed.response.json().catch(() => ({ error: "Qadam bajarilmadi." }))) as { error?: string };
          throw new Error(json.error ?? "Qadam bajarilmadi.");
        }
        return { text: executed.text, tool: step.tool };
      },
    },
  });

  trackTaskEvent({
    status: result.task.status,
    durationMs: Date.now() - started,
    retries: result.task.retryCount,
    cancelled: result.task.status === "cancelled",
    failed: result.task.status === "failed",
    stepCount: result.steps.length,
    toolCalls: result.task.toolCalls,
  });

  return { ok: true as const, task: result.task, steps: result.steps };
}

export function toClientTask(task: TaskRecord, steps: TaskStep[]) {
  return {
    id: task.id,
    agentId: task.agentId,
    projectId: task.projectId,
    title: task.title,
    input: task.input,
    kind: task.kind,
    status: task.status,
    summary: task.summary,
    result: task.result,
    sources: task.sources,
    files: task.files,
    toolsUsed: task.toolsUsed,
    currentStep: task.currentStep,
    stepCount: task.stepCount,
    currentLabel: steps.find((step) => step.index === Math.max(0, task.currentStep - 1))?.label ?? null,
    steps: steps.map((step) => ({
      id: step.id,
      index: step.index,
      key: step.key,
      label: step.label,
      status: step.status,
      tool: step.tool,
    })),
    retryCount: task.retryCount,
    error: task.error,
    durationMs: task.durationMs,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
