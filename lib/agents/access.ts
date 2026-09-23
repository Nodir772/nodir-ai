import { ownedRow, ownedStatus } from "@/lib/projects/access";
import type { AgentDefinition } from "@/lib/agents/types";
import { getBuiltinAgent } from "@/lib/agents/catalog";
import { canUseBuiltinAgent } from "@/lib/agents/catalog";
import type { PlanId } from "@/lib/billing/plans";

export { ownedRow, ownedStatus };

export type ResolvedAgentResult =
  | { ok: true; agent: AgentDefinition; builtin: boolean }
  | { ok: false; status: 402 | 403 | 404; code: "PLAN_REQUIRED" | "FORBIDDEN" | "NOT_FOUND"; error: string };

export function resolveListedAgent(
  id: string,
  userId: string,
  plan: PlanId,
  custom: AgentDefinition | null,
): ResolvedAgentResult {
  const builtin = getBuiltinAgent(id);
  if (builtin) {
    if (!canUseBuiltinAgent(plan, id)) {
      return {
        ok: false,
        status: 402,
        code: "PLAN_REQUIRED",
        error: `${builtin.name} uchun yuqoriroq tarif kerak.`,
      };
    }
    return { ok: true, agent: builtin, builtin: true };
  }
  const owned = ownedRow(custom, userId);
  if (!owned.ok) {
    if (owned.forbidden) {
      return { ok: false, status: 403, code: "FORBIDDEN", error: "Bu agentga kirish huquqingiz yo'q." };
    }
    return { ok: false, status: 404, code: "NOT_FOUND", error: "Agent topilmadi." };
  }
  if (!owned.row.enabled) {
    return { ok: false, status: 404, code: "NOT_FOUND", error: "Agent o'chirilgan." };
  }
  return { ok: true, agent: owned.row, builtin: false };
}

export function denyBuiltinMutation() {
  return {
    ok: false as const,
    status: 403 as const,
    code: "FORBIDDEN" as const,
    error: "Tayyor agentlarni o'zgartirib bo'lmaydi. Nusxa oling.",
  };
}
