import type { AiModelId } from "@/lib/ai/models";
import type { AiToolId } from "@/lib/ai/tools";

export type PlanId = "free" | "pro" | "pro_plus" | "pro_max";
export type PaidPlanId = Exclude<PlanId, "free">;
export type ContextLevel = "basic" | "standard" | "high" | "max";

export const PLAN_IDS: PlanId[] = ["free", "pro", "pro_plus", "pro_max"];
export const PAID_PLAN_IDS: PaidPlanId[] = ["pro", "pro_plus", "pro_max"];

export type BillingFeature =
  | "chat"
  | "image"
  | "documents"
  | "web_search"
  | "voice"
  | "code"
  | "translate"
  | "writer"
  | "summarizer"
  | "advanced_models"
  | "public_sharing";

const ALL_TOOLS: AiToolId[] = ["chat", "translate", "writer", "summarizer", "image", "documents", "code"];
const BASIC_TOOLS: AiToolId[] = ["chat", "translate", "writer", "summarizer", "image", "documents"];
const MB = 1024 * 1024;

export type PlanDefinition = {
  id: PlanId;
  name: string;
  price: number;
  yearlyPrice: number;
  currency: "USD";
  description: string;
  popular: boolean;
  badge: string | null;
  aiMessages: number;
  imageGenerations: number;
  documentAnalyses: number;
  webSearches: number;
  voiceMinutes: number;
  allowedModels: AiModelId[];
  allowedTools: AiToolId[];
  contextLevel: ContextLevel;
  fileSizeLimit: number;
  storageBytes: number;
  rateLimit: number;
  priority: number;
  agentCount: number;
  customAgentCount: number;
  tasksPerMonth: number;
  maxStepsPerTask: number;
  maxToolCallsPerTask: number;
  automationCount: number;
  maxTaskDurationMs: number;
  features: Record<BillingFeature, boolean>;
  bullets: string[];
  limits: string[];
  monthlyPrice: number;
  messageLimit: number;
  imageLimit: number;
  documentLimit: number;
  searchLimit: number;
  voiceLimit: number;
  rateLimitPerMinute: number;
};

function envInt(name: string, fallback: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function envIntAlias(names: string[], fallback: number) {
  for (const name of names) {
    if (process.env[name]?.trim()) return envInt(name, fallback);
  }
  return fallback;
}

function definePlan(
  input: Omit<
    PlanDefinition,
    | "monthlyPrice"
    | "messageLimit"
    | "imageLimit"
    | "documentLimit"
    | "searchLimit"
    | "voiceLimit"
    | "rateLimitPerMinute"
  >,
): PlanDefinition {
  return {
    ...input,
    monthlyPrice: input.price,
    messageLimit: input.aiMessages,
    imageLimit: input.imageGenerations,
    documentLimit: input.documentAnalyses,
    searchLimit: input.webSearches,
    voiceLimit: input.voiceMinutes,
    rateLimitPerMinute: input.rateLimit,
  };
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: definePlan({
    id: "free",
    name: "Free",
    price: 0,
    yearlyPrice: 0,
    currency: "USD",
    description: "Boshlash va sinab ko'rish uchun.",
    popular: false,
    badge: null,
    aiMessages: envIntAlias(["FREE_MONTHLY_MESSAGES", "FREE_MESSAGES_PER_DAY", "FREE_DAILY_MESSAGES"], 50),
    imageGenerations: envIntAlias(
      ["FREE_MONTHLY_IMAGES", "FREE_IMAGE_GENERATIONS_PER_DAY", "FREE_DAILY_IMAGE_GENERATIONS"],
      5,
    ),
    documentAnalyses: envIntAlias(["FREE_MONTHLY_DOCUMENTS", "FREE_DOCUMENTS_PER_DAY", "FREE_DOCUMENT_LIMIT"], 3),
    webSearches: envIntAlias(["FREE_MONTHLY_SEARCHES"], 10),
    voiceMinutes: envIntAlias(["FREE_MONTHLY_VOICE_MINUTES"], 30),
    allowedModels: ["nodir-fast"],
    allowedTools: BASIC_TOOLS,
    contextLevel: "basic",
    fileSizeLimit: 8 * MB,
    storageBytes: envInt("FREE_STORAGE_BYTES", 50 * MB),
    rateLimit: 20,
    priority: 0,
    agentCount: envInt("FREE_AGENT_COUNT", 3),
    customAgentCount: envInt("FREE_CUSTOM_AGENT_COUNT", 0),
    tasksPerMonth: envInt("FREE_TASKS_PER_MONTH", 5),
    maxStepsPerTask: envInt("FREE_MAX_STEPS_PER_TASK", 4),
    maxToolCallsPerTask: envInt("FREE_MAX_TOOL_CALLS_PER_TASK", 4),
    automationCount: envInt("FREE_AUTOMATION_COUNT", 0),
    maxTaskDurationMs: envInt("FREE_MAX_TASK_DURATION_MS", 45_000),
    features: {
      chat: true,
      image: true,
      documents: true,
      web_search: true,
      voice: true,
      code: false,
      translate: true,
      writer: true,
      summarizer: true,
      advanced_models: false,
      public_sharing: true,
    },
    bullets: [
      "50 AI xabar / oy",
      "Fast model",
      "Asosiy vositalar",
      "3 tayyor agent · 5 vazifa",
      "5 rasm · 3 hujjat",
      "10 qidiruv · 30 daqiqa ovoz",
    ],
    limits: ["Kod yordamchisi Pro da", "Maxsus agentlar Pro da", "Balanced va Advanced modellar yuqoriroq tariflarda"],
  }),
  pro: definePlan({
    id: "pro",
    name: "Pro",
    price: 7,
    yearlyPrice: 70,
    currency: "USD",
    description: "Kundalik ish, qidiruv va ovoz uchun.",
    popular: false,
    badge: null,
    aiMessages: envIntAlias(["PRO_MONTHLY_MESSAGES", "PRO_DAILY_MESSAGES"], 2000),
    imageGenerations: envIntAlias(["PRO_MONTHLY_IMAGES", "PRO_DAILY_IMAGE_GENERATIONS"], 50),
    documentAnalyses: envIntAlias(["PRO_MONTHLY_DOCUMENTS", "PRO_DOCUMENT_LIMIT"], 30),
    webSearches: envIntAlias(["PRO_MONTHLY_SEARCHES", "PRO_DAILY_SEARCH"], 100),
    voiceMinutes: envIntAlias(["PRO_MONTHLY_VOICE_MINUTES", "PRO_DAILY_VOICE"], 300),
    allowedModels: ["nodir-fast", "nodir-balanced"],
    allowedTools: ALL_TOOLS,
    contextLevel: "standard",
    fileSizeLimit: 16 * MB,
    storageBytes: envInt("PRO_STORAGE_BYTES", 500 * MB),
    rateLimit: 60,
    priority: 1,
    agentCount: envInt("PRO_AGENT_COUNT", 5),
    customAgentCount: envInt("PRO_CUSTOM_AGENT_COUNT", 5),
    tasksPerMonth: envInt("PRO_TASKS_PER_MONTH", 40),
    maxStepsPerTask: envInt("PRO_MAX_STEPS_PER_TASK", 8),
    maxToolCallsPerTask: envInt("PRO_MAX_TOOL_CALLS_PER_TASK", 8),
    automationCount: envInt("PRO_AUTOMATION_COUNT", 5),
    maxTaskDurationMs: envInt("PRO_MAX_TASK_DURATION_MS", 90_000),
    features: {
      chat: true,
      image: true,
      documents: true,
      web_search: true,
      voice: true,
      code: true,
      translate: true,
      writer: true,
      summarizer: true,
      advanced_models: false,
      public_sharing: true,
    },
    bullets: [
      "2 000 AI xabar / oy",
      "Fast + Balanced",
      "Barcha vositalar",
      "5 agent · 5 maxsus · 40 vazifa",
      "50 rasm · 30 hujjat",
      "100 qidiruv · 300 daqiqa ovoz",
    ],
    limits: ["Advanced model Pro Plus va Pro Max da"],
  }),
  pro_plus: definePlan({
    id: "pro_plus",
    name: "Pro Plus",
    price: 10,
    yearlyPrice: 100,
    currency: "USD",
    description: "Ko'proq limit, Advanced model va yuqori tezlik.",
    popular: true,
    badge: "Eng mashhur",
    aiMessages: envIntAlias(["PRO_PLUS_MONTHLY_MESSAGES"], 5000),
    imageGenerations: envIntAlias(["PRO_PLUS_MONTHLY_IMAGES"], 150),
    documentAnalyses: envIntAlias(["PRO_PLUS_MONTHLY_DOCUMENTS"], 100),
    webSearches: envIntAlias(["PRO_PLUS_MONTHLY_SEARCHES"], 300),
    voiceMinutes: envIntAlias(["PRO_PLUS_MONTHLY_VOICE_MINUTES"], 1000),
    allowedModels: ["nodir-fast", "nodir-balanced", "nodir-advanced"],
    allowedTools: ALL_TOOLS,
    contextLevel: "high",
    fileSizeLimit: 32 * MB,
    storageBytes: envInt("PRO_PLUS_STORAGE_BYTES", 2 * 1024 * MB),
    rateLimit: 100,
    priority: 2,
    agentCount: envInt("PRO_PLUS_AGENT_COUNT", 6),
    customAgentCount: envInt("PRO_PLUS_CUSTOM_AGENT_COUNT", 15),
    tasksPerMonth: envInt("PRO_PLUS_TASKS_PER_MONTH", 150),
    maxStepsPerTask: envInt("PRO_PLUS_MAX_STEPS_PER_TASK", 12),
    maxToolCallsPerTask: envInt("PRO_PLUS_MAX_TOOL_CALLS_PER_TASK", 12),
    automationCount: envInt("PRO_PLUS_AUTOMATION_COUNT", 20),
    maxTaskDurationMs: envInt("PRO_PLUS_MAX_TASK_DURATION_MS", 120_000),
    features: {
      chat: true,
      image: true,
      documents: true,
      web_search: true,
      voice: true,
      code: true,
      translate: true,
      writer: true,
      summarizer: true,
      advanced_models: true,
      public_sharing: true,
    },
    bullets: [
      "5 000 AI xabar / oy",
      "Fast + Balanced + Advanced",
      "Barcha agentlar · 15 maxsus · 150 vazifa",
      "150 rasm · 100 hujjat",
      "300 qidiruv · 1 000 daqiqa ovoz",
      "Yuqori so'rov limiti",
    ],
    limits: [],
  }),
  pro_max: definePlan({
    id: "pro_max",
    name: "Pro Max",
    price: 15,
    yearlyPrice: 150,
    currency: "USD",
    description: "Eng yuqori limitlar, barcha modellar va ustuvor navbat.",
    popular: false,
    badge: "Maksimal",
    aiMessages: envIntAlias(["PRO_MAX_MONTHLY_MESSAGES", "PREMIUM_DAILY_MESSAGES"], 10000),
    imageGenerations: envIntAlias(["PRO_MAX_MONTHLY_IMAGES", "PREMIUM_DAILY_IMAGE_GENERATIONS"], 400),
    documentAnalyses: envIntAlias(["PRO_MAX_MONTHLY_DOCUMENTS", "PREMIUM_DOCUMENT_LIMIT"], 250),
    webSearches: envIntAlias(["PRO_MAX_MONTHLY_SEARCHES", "PREMIUM_DAILY_SEARCH"], 700),
    voiceMinutes: envIntAlias(["PRO_MAX_MONTHLY_VOICE_MINUTES", "PREMIUM_DAILY_VOICE"], 2000),
    allowedModels: ["nodir-fast", "nodir-balanced", "nodir-advanced"],
    allowedTools: ALL_TOOLS,
    contextLevel: "max",
    fileSizeLimit: 64 * MB,
    storageBytes: envInt("PRO_MAX_STORAGE_BYTES", 10 * 1024 * MB),
    rateLimit: 160,
    priority: 3,
    agentCount: envInt("PRO_MAX_AGENT_COUNT", 6),
    customAgentCount: envInt("PRO_MAX_CUSTOM_AGENT_COUNT", 40),
    tasksPerMonth: envInt("PRO_MAX_TASKS_PER_MONTH", 400),
    maxStepsPerTask: envInt("PRO_MAX_MAX_STEPS_PER_TASK", 16),
    maxToolCallsPerTask: envInt("PRO_MAX_MAX_TOOL_CALLS_PER_TASK", 20),
    automationCount: envInt("PRO_MAX_AUTOMATION_COUNT", 50),
    maxTaskDurationMs: envInt("PRO_MAX_MAX_TASK_DURATION_MS", 180_000),
    features: {
      chat: true,
      image: true,
      documents: true,
      web_search: true,
      voice: true,
      code: true,
      translate: true,
      writer: true,
      summarizer: true,
      advanced_models: true,
      public_sharing: true,
    },
    bullets: [
      "10 000 AI xabar / oy",
      "Barcha modellar",
      "Barcha agentlar · 40 maxsus · 400 vazifa",
      "400 rasm · 250 hujjat",
      "700 qidiruv · 2 000 daqiqa ovoz",
      "Eng yuqori tezlik va ustuvorlik",
    ],
    limits: [],
  }),
};

export const PLAN_LIST: PlanDefinition[] = PLAN_IDS.map((id) => PLANS[id]);

export function isPlanId(value: string | null | undefined): value is PlanId {
  return value === "free" || value === "pro" || value === "pro_plus" || value === "pro_max";
}

export function isPaidPlan(value: string | null | undefined): value is PaidPlanId {
  return value === "pro" || value === "pro_plus" || value === "pro_max";
}

/** Maps legacy `premium` rows to Pro Max so existing paid users keep access. */
export function resolvePlanId(value: string | null | undefined): PlanId {
  if (value === "premium" || value === "pro_max") return "pro_max";
  if (value === "pro_plus") return "pro_plus";
  if (value === "pro") return "pro";
  return "free";
}

export function getPlan(id: string | null | undefined): PlanDefinition {
  return PLANS[resolvePlanId(id)];
}

export function planRank(id: string | null | undefined) {
  return getPlan(id).priority;
}

export function nextPlanId(id: string | null | undefined): PaidPlanId | null {
  const current = resolvePlanId(id);
  if (current === "free") return "pro";
  if (current === "pro") return "pro_plus";
  if (current === "pro_plus") return "pro_max";
  return null;
}

export function recommendedUpgrade(id: string | null | undefined) {
  const next = nextPlanId(id);
  if (!next) return null;
  const plan = PLANS[next];
  return {
    plan: next,
    name: plan.name,
    price: plan.price,
    yearlyPrice: plan.yearlyPrice,
  };
}

export function isHighestPlan(id: string | null | undefined) {
  return resolvePlanId(id) === "pro_max";
}

export function yearlySavingsMonths(plan: PlanDefinition) {
  if (plan.price <= 0 || plan.yearlyPrice <= 0) return 0;
  return Math.max(0, Math.round((plan.price * 12 - plan.yearlyPrice) / plan.price));
}

export function requiredPlanForFeature(feature: BillingFeature): PlanId {
  for (const id of PLAN_IDS) {
    if (PLANS[id].features[feature]) return id;
  }
  return "pro_max";
}

export function requiredPlanForModel(model: AiModelId): PlanId {
  for (const id of PLAN_IDS) {
    if (PLANS[id].allowedModels.includes(model)) return id;
  }
  return "pro_max";
}

export function requiredPlanForTool(tool: AiToolId): PlanId {
  for (const id of PLAN_IDS) {
    if (PLANS[id].allowedTools.includes(tool)) return id;
  }
  return "pro_max";
}

export function contextLimitsFor(plan: string | null | undefined) {
  const level = getPlan(plan).contextLevel;
  if (level === "basic") return { maxMessages: 12, maxMessageChars: 8_000, maxRequestChars: 24_000 };
  if (level === "standard") return { maxMessages: 24, maxMessageChars: 12_000, maxRequestChars: 48_000 };
  if (level === "high") return { maxMessages: 36, maxMessageChars: 16_000, maxRequestChars: 72_000 };
  return { maxMessages: 48, maxMessageChars: 20_000, maxRequestChars: 96_000 };
}

export function agentLimitsFor(plan: string | null | undefined) {
  const definition = getPlan(plan);
  return {
    agentCount: definition.agentCount,
    customAgentCount: definition.customAgentCount,
    tasksPerMonth: definition.tasksPerMonth,
    maxStepsPerTask: definition.maxStepsPerTask,
    maxToolCallsPerTask: definition.maxToolCallsPerTask,
    automationCount: definition.automationCount,
    maxTaskDurationMs: definition.maxTaskDurationMs,
    storageBytes: definition.storageBytes,
  };
}

export const FEATURE_FLAG_KEYS = [
  "image_generation",
  "document_analysis",
  "web_search",
  "voice",
  "advanced_models",
  "public_sharing",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];
