import { randomUUID } from "node:crypto";
import { computeNextRunAt, type AutomationRecord, type ScheduleType } from "@/lib/automations/schedule";

const store = new Map<string, AutomationRecord[]>();

export function localListAutomations(userId: string) {
  return [...(store.get(userId) ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function localGetAutomation(userId: string, id: string) {
  return localListAutomations(userId).find((item) => item.id === id) ?? null;
}

export function localCreateAutomation(
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
  const now = new Date().toISOString();
  const row: AutomationRecord = {
    id: randomUUID(),
    userId,
    agentId: input.agentId,
    projectId: input.projectId ?? null,
    name: input.name.slice(0, 80),
    prompt: input.prompt.slice(0, 8_000),
    enabled: input.enabled !== false,
    scheduleEnabled: Boolean(input.scheduleEnabled),
    scheduleType: input.scheduleType,
    scheduleValue: input.scheduleValue ?? "",
    nextRunAt:
      input.nextRunAt ??
      (input.scheduleEnabled ? computeNextRunAt(input.scheduleType, input.scheduleValue ?? "") : null),
    lastRunAt: null,
    lastStatus: null,
    createdAt: now,
    updatedAt: now,
  };
  store.set(userId, [row, ...localListAutomations(userId)]);
  return row;
}

export function localUpdateAutomation(userId: string, id: string, patch: Partial<AutomationRecord>) {
  const list = localListAutomations(userId);
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const next = { ...list[index]!, ...patch, updatedAt: new Date().toISOString() };
  list[index] = next;
  store.set(userId, list);
  return next;
}

export function localDeleteAutomation(userId: string, id: string) {
  const list = localListAutomations(userId);
  const found = list.find((item) => item.id === id);
  if (!found) return false;
  store.set(
    userId,
    list.filter((item) => item.id !== id),
  );
  return true;
}

export function resetLocalAutomations() {
  store.clear();
}
