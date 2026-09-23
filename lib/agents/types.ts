import type { AiModelId } from "@/lib/ai/models";
import type { PlanId } from "@/lib/billing/plans";

export const AGENT_TOOL_IDS = [
  "web_search",
  "documents",
  "image",
  "writing",
  "code",
  "translation",
  "summarizer",
] as const;

export type AgentToolId = (typeof AGENT_TOOL_IDS)[number];

export const BUILTIN_AGENT_IDS = ["general", "research", "coding", "writing", "study", "document"] as const;
export type BuiltinAgentId = (typeof BUILTIN_AGENT_IDS)[number];

export const AGENT_ICONS = ["sparkles", "search", "code", "pen", "book", "file-text"] as const;
export type AgentIcon = (typeof AGENT_ICONS)[number];

export type AgentSource = "builtin" | "custom";

export type AgentDefinition = {
  id: string;
  userId: string | null;
  name: string;
  description: string;
  icon: AgentIcon;
  instructions: string;
  allowedTools: AgentToolId[];
  model: AiModelId;
  minPlan: PlanId;
  enabled: boolean;
  source: AgentSource;
  projectId: string | null;
  published: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicAgentProfile = {
  id: string;
  name: string;
  description: string;
  icon: AgentIcon;
  tools: AgentToolId[];
  source: AgentSource;
};

export function isAgentToolId(value: string): value is AgentToolId {
  return (AGENT_TOOL_IDS as readonly string[]).includes(value);
}

export function isBuiltinAgentId(value: string): value is BuiltinAgentId {
  return (BUILTIN_AGENT_IDS as readonly string[]).includes(value);
}

export function isAgentIcon(value: string): value is AgentIcon {
  return (AGENT_ICONS as readonly string[]).includes(value);
}

export function publicAgentProfile(agent: AgentDefinition): PublicAgentProfile {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    icon: agent.icon,
    tools: agent.allowedTools,
    source: agent.source,
  };
}
