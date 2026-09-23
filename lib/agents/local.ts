import { randomUUID } from "node:crypto";
import type { AgentDefinition } from "@/lib/agents/types";
import { isAgentIcon, isAgentToolId, type AgentIcon, type AgentToolId } from "@/lib/agents/types";
import type { AiModelId } from "@/lib/ai/models";
import { isAllowedModelId } from "@/lib/ai/config";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";

const store = new Map<string, AgentDefinition[]>();

export function localListAgents(userId: string): AgentDefinition[] {
  return [...(store.get(userId) ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function localGetAgent(userId: string, id: string) {
  return localListAgents(userId).find((agent) => agent.id === id) ?? null;
}

export function localCreateAgent(
  userId: string,
  input: {
    name: string;
    description?: string;
    icon?: AgentIcon;
    instructions?: string;
    allowedTools?: AgentToolId[];
    model?: AiModelId;
    enabled?: boolean;
    projectId?: string | null;
    published?: boolean;
    publicSlug?: string | null;
  },
): AgentDefinition {
  const now = new Date().toISOString();
  const agent: AgentDefinition = {
    id: randomUUID(),
    userId,
    name: input.name,
    description: (input.description ?? "").slice(0, 500),
    icon: input.icon && isAgentIcon(input.icon) ? input.icon : "sparkles",
    instructions: (input.instructions ?? "").slice(0, 8_000),
    allowedTools: (input.allowedTools ?? []).filter(isAgentToolId),
    model: input.model && isAllowedModelId(input.model) ? input.model : DEFAULT_MODEL_ID,
    minPlan: "free",
    enabled: input.enabled !== false,
    source: "custom",
    projectId: input.projectId ?? null,
    published: Boolean(input.published),
    publicSlug: input.publicSlug ?? null,
    createdAt: now,
    updatedAt: now,
  };
  store.set(userId, [agent, ...localListAgents(userId)]);
  return agent;
}

export function localUpdateAgent(
  userId: string,
  id: string,
  patch: Partial<
    Pick<
      AgentDefinition,
      "name" | "description" | "icon" | "instructions" | "allowedTools" | "model" | "enabled" | "projectId" | "published" | "publicSlug"
    >
  >,
) {
  const list = localListAgents(userId);
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const next = { ...list[index]!, ...patch, updatedAt: new Date().toISOString() };
  list[index] = next;
  store.set(userId, list);
  return next;
}

export function localDeleteAgent(userId: string, id: string) {
  const list = localListAgents(userId);
  const found = list.find((item) => item.id === id);
  if (!found) return false;
  store.set(
    userId,
    list.filter((item) => item.id !== id),
  );
  return true;
}

export function localFindPublished(slug: string) {
  for (const list of store.values()) {
    const hit = list.find((agent) => agent.published && agent.publicSlug === slug);
    if (hit) return hit;
  }
  return null;
}

export function resetLocalAgents() {
  store.clear();
}
