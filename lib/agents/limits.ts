import { agentLimitsFor, getPlan, planRank, type PlanId } from "@/lib/billing/plans";
import { canUseBuiltinAgent } from "@/lib/agents/catalog";
import type { AgentToolId } from "@/lib/agents/types";

export { agentLimitsFor };

export function assertCustomAgentQuota(plan: PlanId | string | null | undefined, currentCustomCount: number) {
  const limits = agentLimitsFor(plan);
  if (currentCustomCount >= limits.customAgentCount) {
    return {
      ok: false as const,
      status: 402 as const,
      code: "PLAN_REQUIRED" as const,
      error:
        limits.customAgentCount === 0
          ? "Maxsus agentlar Pro rejasidan boshlanadi."
          : "Maxsus agentlar limiti tugadi. Tarifni yangilang.",
      requiredPlan: nextPlanWithMoreCustom(plan),
    };
  }
  return { ok: true as const, remaining: limits.customAgentCount - currentCustomCount };
}

export function assertTaskQuota(plan: PlanId | string | null | undefined, usedThisMonth: number) {
  const limits = agentLimitsFor(plan);
  if (usedThisMonth >= limits.tasksPerMonth) {
    return {
      ok: false as const,
      status: 429 as const,
      code: "USAGE_LIMIT" as const,
      error: "Oylik vazifalar limiti tugadi.",
      limit: limits.tasksPerMonth,
    };
  }
  return { ok: true as const, remaining: limits.tasksPerMonth - usedThisMonth, limits };
}

export function assertAutomationQuota(plan: PlanId | string | null | undefined, currentCount: number) {
  const limits = agentLimitsFor(plan);
  if (currentCount >= limits.automationCount) {
    return {
      ok: false as const,
      status: 402 as const,
      code: "PLAN_REQUIRED" as const,
      error:
        limits.automationCount === 0
          ? "Avtomatlashtirish Pro rejasidan boshlanadi."
          : "Avtomatlashtirish limiti tugadi.",
    };
  }
  return { ok: true as const };
}

export function builtinUnlocked(plan: PlanId | string | null | undefined, agentId: string) {
  return canUseBuiltinAgent(plan, agentId);
}

export function planAllowsAgentTool(plan: PlanId | string | null | undefined, tool: AgentToolId) {
  const allowed = getPlan(plan).features;
  if (tool === "web_search") return allowed.web_search;
  if (tool === "documents") return allowed.documents;
  if (tool === "image") return allowed.image;
  if (tool === "writing") return allowed.writer;
  if (tool === "code") return allowed.code;
  if (tool === "translation") return allowed.translate;
  if (tool === "summarizer") return allowed.summarizer;
  return false;
}

function nextPlanWithMoreCustom(plan: PlanId | string | null | undefined): PlanId {
  const current = getPlan(plan);
  if (planRank(current.id) < planRank("pro")) return "pro";
  if (planRank(current.id) < planRank("pro_plus")) return "pro_plus";
  return "pro_max";
}
