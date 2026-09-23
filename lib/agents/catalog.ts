import type { AgentDefinition, BuiltinAgentId } from "@/lib/agents/types";
import { planRank, type PlanId } from "@/lib/billing/plans";

const STAMP = "2026-01-01T00:00:00.000Z";

function builtin(
  id: BuiltinAgentId,
  rest: Omit<AgentDefinition, "id" | "userId" | "source" | "projectId" | "published" | "publicSlug" | "createdAt" | "updatedAt" | "enabled">,
): AgentDefinition {
  return {
    id,
    userId: null,
    source: "builtin",
    projectId: null,
    published: true,
    publicSlug: id,
    enabled: true,
    createdAt: STAMP,
    updatedAt: STAMP,
    ...rest,
  };
}

export const BUILTIN_AGENTS: AgentDefinition[] = [
  builtin("general", {
    name: "Umumiy yordamchi",
    description: "Savol, reja va kundalik vazifalar uchun universal agent.",
    icon: "sparkles",
    minPlan: "free",
    model: "nodir-fast",
    allowedTools: ["web_search", "writing", "summarizer", "translation"],
    instructions:
      "You are Nodir AI General Agent. Help with everyday questions, planning, and explanations. Be concise. If a specialist agent would be better, say so. Do not invent sources.",
  }),
  builtin("research", {
    name: "Tadqiqot",
    description: "Mavzuni qidirib, manbalar asosida xulosa va hisobot yozadi.",
    icon: "search",
    minPlan: "pro",
    model: "nodir-balanced",
    allowedTools: ["web_search", "documents", "summarizer", "writing"],
    instructions:
      "You are Nodir AI Research Agent. Investigate the topic using provided search and document excerpts only. Cite only those sources. Separate facts from uncertainty. Never invent papers, URLs, or quotes.",
  }),
  builtin("coding", {
    name: "Dasturlash",
    description: "Kod yozadi, tushuntiradi va yaxshilaydi. Kod bajarilmaydi.",
    icon: "code",
    minPlan: "pro_plus",
    model: "nodir-advanced",
    allowedTools: ["code", "documents", "summarizer"],
    instructions:
      "You are Nodir AI Coding Agent. Write correct, readable code and explain it. Never execute code or claim that you ran it. Do not include secrets. Prefer the requested language.",
  }),
  builtin("writing", {
    name: "Yozuvchi",
    description: "Xat, maqola, post va rasmiy matnlarni yozadi.",
    icon: "pen",
    minPlan: "free",
    model: "nodir-fast",
    allowedTools: ["writing", "translation", "summarizer"],
    instructions:
      "You are Nodir AI Writing Agent. Produce polished text in the requested tone and format. Do not invent facts, citations, or credentials.",
  }),
  builtin("study", {
    name: "O'qish",
    description: "Mavzuni tushuntiradi, xulosa va mashqlar tayyorlaydi.",
    icon: "book",
    minPlan: "free",
    model: "nodir-fast",
    allowedTools: ["documents", "summarizer", "web_search", "writing"],
    instructions:
      "You are Nodir AI Study Agent. Explain clearly, quiz gently, and summarize faithfully. Use only provided documents or search excerpts. Do not invent syllabus facts.",
  }),
  builtin("document", {
    name: "Hujjat tahlili",
    description: "PDF va matn fayllardan javob, xulosa va qayta yozish.",
    icon: "file-text",
    minPlan: "pro",
    model: "nodir-balanced",
    allowedTools: ["documents", "summarizer", "writing"],
    instructions:
      "You are Nodir AI Document Agent. Answer only from provided document excerpts. If the file is insufficient, say so. Never invent quotes from the document.",
  }),
];

export function getBuiltinAgent(id: string) {
  return BUILTIN_AGENTS.find((agent) => agent.id === id) ?? null;
}

export function unlockedBuiltinAgents(plan: PlanId | string | null | undefined) {
  const rank = planRank(plan);
  return BUILTIN_AGENTS.filter((agent) => planRank(agent.minPlan) <= rank);
}

export function canUseBuiltinAgent(plan: PlanId | string | null | undefined, id: string) {
  const agent = getBuiltinAgent(id);
  if (!agent) return false;
  return planRank(plan) >= planRank(agent.minPlan);
}
