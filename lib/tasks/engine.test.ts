import assert from "node:assert/strict";
import { test } from "node:test";
import { limitsForPlan, planTaskSteps, remainingRunnableSteps, runBoundedTask, stepsForRetry } from "./engine";
import { buildStepsForKind } from "./steps";
import type { TaskRecord, TaskStep } from "./types";

function task(partial?: Partial<TaskRecord>): TaskRecord {
  return {
    id: "t1",
    userId: "u1",
    agentId: "research",
    projectId: null,
    title: "Mavzu",
    input: "Tadqiq qil",
    kind: "research",
    status: "pending",
    summary: "",
    result: "",
    sources: [],
    files: [],
    toolsUsed: [],
    currentStep: 0,
    stepCount: 4,
    toolCalls: 0,
    retryCount: 0,
    error: null,
    startedAt: null,
    finishedAt: null,
    durationMs: null,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...partial,
  };
}

test("research tasks have explicit observable steps", () => {
  const steps = buildStepsForKind("research");
  assert.deepEqual(
    steps.map((item) => item.key),
    ["search", "sources", "summarize", "report"],
  );
});

test("cancellation stops future steps", async () => {
  let status: TaskRecord["status"] = "running";
  const planned = planTaskSteps("research", 4);
  const steps: TaskStep[] = planned.map((item, index) => ({
    id: `s${index}`,
    taskId: "t1",
    index,
    key: item.key,
    label: item.label,
    status: "pending",
    tool: item.tool,
    output: "",
    error: null,
    startedAt: null,
    finishedAt: null,
  }));
  const result = await runBoundedTask({
    task: task(),
    steps,
    planned,
    limits: limitsForPlan("pro"),
    deps: {
      allowedTools: ["web_search", "summarizer", "writing"],
      load: async () => task({ status }),
      save: async () => undefined,
      executeStep: async () => {
        status = "cancelled";
        return { text: "qidiruv" };
      },
    },
  });
  assert.equal(result.task.status, "cancelled");
  const completed = result.steps.filter((item) => item.status === "completed").length;
  assert.ok(completed <= 1);
});

test("retry skips completed steps", () => {
  const steps: TaskStep[] = [
    {
      id: "1",
      taskId: "t",
      index: 0,
      key: "search",
      label: "Qidiruv",
      status: "completed",
      tool: "web_search",
      output: "ok",
      error: null,
      startedAt: null,
      finishedAt: null,
    },
    {
      id: "2",
      taskId: "t",
      index: 1,
      key: "report",
      label: "Hisobot",
      status: "failed",
      tool: "writing",
      output: "",
      error: "xato",
      startedAt: null,
      finishedAt: null,
    },
  ];
  const next = stepsForRetry(steps);
  assert.equal(next[0]?.status, "completed");
  assert.equal(next[1]?.status, "pending");
  assert.equal(remainingRunnableSteps(next).length, 1);
});

test("max steps and tool calls are bounded by the plan", async () => {
  const planned = planTaskSteps("research", 8);
  assert.ok(planned.length <= 8);
  const tight = limitsForPlan("free");
  const steps: TaskStep[] = planned.map((item, index) => ({
    id: `s${index}`,
    taskId: "t1",
    index,
    key: item.key,
    label: item.label,
    status: "pending" as const,
    tool: item.tool,
    output: "",
    error: null,
    startedAt: null,
    finishedAt: null,
  }));
  const result = await runBoundedTask({
    task: task({ toolCalls: tight.maxToolCallsPerTask }),
    steps,
    planned,
    limits: tight,
    deps: {
      allowedTools: ["web_search", "summarizer", "writing"],
      load: async () => task({ status: "running", toolCalls: tight.maxToolCallsPerTask }),
      save: async () => undefined,
      executeStep: async () => ({ text: "x" }),
    },
  });
  assert.equal(result.task.status, "failed");
  assert.match(result.task.error ?? "", /Vosita|Qadam|limiti/i);
});
