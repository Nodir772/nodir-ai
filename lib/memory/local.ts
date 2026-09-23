import { randomUUID } from "node:crypto";
import type { Memory, MemoryCategory } from "@/lib/memory/types";

const store = new Map<string, Memory[]>();

export function localList(
  userId: string,
  options?: { projectId?: string | null; agentId?: string | null },
): Memory[] {
  const all = [...(store.get(userId) ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return all.filter((item) => {
    if (options?.agentId) return item.agentId === options.agentId;
    if (item.agentId) return false;
    if (!options || !("projectId" in options)) return true;
    if (options.projectId) return item.projectId === options.projectId;
    return !item.projectId;
  });
}

export function localCreate(
  userId: string,
  content: string,
  category: MemoryCategory,
  projectId?: string | null,
  agentId?: string | null,
): Memory {
  const now = new Date().toISOString();
  const memory: Memory = {
    id: randomUUID(),
    userId,
    content,
    category,
    projectId: projectId ?? null,
    agentId: agentId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  store.set(userId, [memory, ...(store.get(userId) ?? [])]);
  return memory;
}

export function localUpdate(userId: string, id: string, patch: Partial<Pick<Memory, "content" | "category">>) {
  const list = localList(userId);
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const next = {
    ...list[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  list[index] = next;
  store.set(userId, list);
  return next;
}

export function localDelete(userId: string, id: string) {
  const list = localList(userId).filter((item) => item.id !== id);
  store.set(userId, list);
}

export function localDeleteAll(userId: string) {
  store.set(userId, []);
}
