import { getPlan, recommendedUpgrade, resolvePlanId, type PlanId } from "@/lib/billing/plans";

export type UsageTool =
  | "chat"
  | "image"
  | "documents"
  | "translate"
  | "writer"
  | "code"
  | "summarizer"
  | "search"
  | "voice";

export type { PlanId };

export const MESSAGE_USAGE_TOOLS: UsageTool[] = ["chat", "translate", "writer", "code", "summarizer"];

export function isMessageUsageTool(tool: UsageTool) {
  return MESSAGE_USAGE_TOOLS.includes(tool);
}

export function usageFeatureKeys(tool: UsageTool): UsageTool[] {
  if (isMessageUsageTool(tool)) return MESSAGE_USAGE_TOOLS;
  return [tool];
}

export function capForTool(plan: string, tool: UsageTool) {
  const definition = getPlan(plan);
  if (tool === "image") return definition.imageGenerations;
  if (tool === "documents") return definition.documentAnalyses;
  if (tool === "search") return definition.webSearches;
  if (tool === "voice") return definition.voiceMinutes;
  return definition.aiMessages;
}

export const USAGE_LIMITS = {
  free: {
    monthlyMessages: getPlan("free").aiMessages,
    monthlyImageGenerations: getPlan("free").imageGenerations,
    monthlyDocuments: getPlan("free").documentAnalyses,
  },
  pro: {
    monthlyMessages: getPlan("pro").aiMessages,
    monthlyImageGenerations: getPlan("pro").imageGenerations,
    monthlyDocuments: getPlan("pro").documentAnalyses,
  },
  pro_plus: {
    monthlyMessages: getPlan("pro_plus").aiMessages,
    monthlyImageGenerations: getPlan("pro_plus").imageGenerations,
    monthlyDocuments: getPlan("pro_plus").documentAnalyses,
  },
  pro_max: {
    monthlyMessages: getPlan("pro_max").aiMessages,
    monthlyImageGenerations: getPlan("pro_max").imageGenerations,
    monthlyDocuments: getPlan("pro_max").documentAnalyses,
  },
} as const;

export function limitFor(plan: string, kind: "monthlyMessages" | "monthlyImageGenerations" | "monthlyDocuments") {
  return USAGE_LIMITS[resolvePlanId(plan)][kind];
}

export function usageKindForTool(tool: UsageTool): "monthlyMessages" | "monthlyImageGenerations" | "monthlyDocuments" {
  if (tool === "image") return "monthlyImageGenerations";
  if (tool === "documents") return "monthlyDocuments";
  return "monthlyMessages";
}

export function usageSnapshot(used: number, limit: number) {
  const unbounded = limit <= 0;
  const remaining = unbounded ? Number.POSITIVE_INFINITY : Math.max(0, limit - used);
  const percent = unbounded ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  return { used, limit, remaining: unbounded ? null : remaining, percent, unbounded };
}

export function upgradeCopy(plan: string) {
  const next = recommendedUpgrade(plan);
  if (!next) {
    return {
      title: "Sizda eng yuqori reja bor",
      body: "Pro Max barcha limitlar va modellarni o'z ichiga oladi.",
      cta: "Foydalanishni ko'rish",
    };
  }
  return {
    title: `${next.name} ga o'ting`,
    body: `Keyingi tarif ${next.name} — $${next.price}/oy.`,
    cta: `${next.name} — $${next.price}/oy`,
  };
}

export const LIMIT_COPY = {
  title: "Oylik limitingiz tugadi",
  body: "Siz joriy oyning limitiga yetdingiz. Keyingi tarifga o'ting yoki reset sanasini kuting.",
  cta: "Tarifni yangilash",
  wait: "Resetgacha kutish",
} as const;
