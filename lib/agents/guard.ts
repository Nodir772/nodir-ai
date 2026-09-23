import type { AgentDefinition } from "@/lib/agents/types";
import { canUseBuiltinAgent } from "@/lib/agents/catalog";
import { resolveStoredAgent } from "@/lib/agents/store";
import type { AppSession } from "@/lib/auth/app-session";
import { getPlan } from "@/lib/billing/plans";
import { ownedStatus } from "@/lib/projects/access";

export async function requireAgent(session: AppSession, id: string, forUse = true) {
  const resolved = await resolveStoredAgent(session.supabase, session.identity.id, id);
  if (!resolved.ok) {
    const { status, code } = ownedStatus(resolved);
    return {
      ok: false as const,
      response: Response.json(
        {
          error: resolved.forbidden ? "Bu agentga kirish huquqingiz yo'q." : "Agent topilmadi.",
          code,
        },
        { status },
      ),
    };
  }
  if (resolved.builtin && forUse && !canUseBuiltinAgent(session.identity.plan, id)) {
    const required = resolved.agent.minPlan;
    return {
      ok: false as const,
      response: Response.json(
        {
          error: `${resolved.agent.name} uchun ${getPlan(required).name} rejasi talab qilinadi.`,
          code: "PLAN_REQUIRED",
          requiredPlan: required,
        },
        { status: 402 },
      ),
    };
  }
  return { ok: true as const, agent: resolved.agent as AgentDefinition, builtin: resolved.builtin };
}

export function toClientAgent(agent: AgentDefinition, plan: string, favorite = false) {
  const locked = agent.source === "builtin" && !canUseBuiltinAgent(plan, agent.id);
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    icon: agent.icon,
    allowedTools: agent.allowedTools,
    model: agent.model,
    minPlan: agent.minPlan,
    enabled: agent.enabled,
    source: agent.source,
    projectId: agent.projectId,
    published: agent.published,
    publicSlug: agent.publicSlug,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
    locked,
    favorite,
    instructions: agent.source === "custom" ? agent.instructions : agent.instructions,
  };
}

/** Public profile never includes instructions, memory, or conversations. */
export function toPublicAgent(agent: AgentDefinition) {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    icon: agent.icon,
    tools: agent.allowedTools,
    source: agent.source,
  };
}
