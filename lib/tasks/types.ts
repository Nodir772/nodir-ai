export const TASK_STATUSES = ["pending", "running", "paused", "completed", "failed", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_KINDS = ["research", "writing", "coding", "study", "document", "general"] as const;
export type TaskKind = (typeof TASK_KINDS)[number];

export const STEP_STATUSES = ["pending", "running", "completed", "skipped", "failed"] as const;
export type StepStatus = (typeof STEP_STATUSES)[number];

export type TaskStep = {
  id: string;
  taskId: string;
  index: number;
  key: string;
  label: string;
  status: StepStatus;
  tool: string | null;
  output: string;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

export type TaskRecord = {
  id: string;
  userId: string;
  agentId: string;
  projectId: string | null;
  title: string;
  input: string;
  kind: TaskKind;
  status: TaskStatus;
  summary: string;
  result: string;
  sources: { title: string; url: string; snippet: string }[];
  files: { id: string; filename: string }[];
  toolsUsed: string[];
  currentStep: number;
  stepCount: number;
  toolCalls: number;
  retryCount: number;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PlannedStep = {
  key: string;
  label: string;
  tool: string | null;
};

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskKind(value: string): value is TaskKind {
  return (TASK_KINDS as readonly string[]).includes(value);
}

export function isTerminalStatus(status: TaskStatus) {
  return status === "completed" || status === "failed" || status === "cancelled";
}

export function shouldStopStatus(status: TaskStatus) {
  return status === "cancelled" || status === "paused" || status === "failed";
}
