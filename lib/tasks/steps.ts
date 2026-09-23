import type { PlannedStep, TaskKind } from "@/lib/tasks/types";

export function buildStepsForKind(kind: TaskKind): PlannedStep[] {
  if (kind === "research") {
    return [
      { key: "search", label: "Qidiruv", tool: "web_search" },
      { key: "sources", label: "Manbalarni yig'ish", tool: null },
      { key: "summarize", label: "Xulosa", tool: "summarizer" },
      { key: "report", label: "Hisobot", tool: "writing" },
    ];
  }
  if (kind === "writing") {
    return [
      { key: "outline", label: "Reja", tool: "writing" },
      { key: "draft", label: "Qoralama", tool: "writing" },
      { key: "polish", label: "Tahrir", tool: "writing" },
    ];
  }
  if (kind === "coding") {
    return [
      { key: "understand", label: "Talabni tushunish", tool: "code" },
      { key: "draft", label: "Kod qoralamasi", tool: "code" },
      { key: "explain", label: "Tushuntirish", tool: "code" },
    ];
  }
  if (kind === "study") {
    return [
      { key: "gather", label: "Material", tool: "documents" },
      { key: "explain", label: "Tushuntirish", tool: "writing" },
      { key: "summary", label: "Xulosa", tool: "summarizer" },
    ];
  }
  if (kind === "document") {
    return [
      { key: "extract", label: "Hujjatdan olish", tool: "documents" },
      { key: "analyze", label: "Tahlil", tool: "summarizer" },
      { key: "rewrite", label: "Qayta yozish", tool: "writing" },
    ];
  }
  return [
    { key: "plan", label: "Reja", tool: "writing" },
    { key: "execute", label: "Bajarish", tool: "writing" },
    { key: "summary", label: "Xulosa", tool: "summarizer" },
  ];
}

export function kindFromAgentId(agentId: string): TaskKind {
  if (agentId === "research") return "research";
  if (agentId === "coding") return "coding";
  if (agentId === "writing") return "writing";
  if (agentId === "study") return "study";
  if (agentId === "document") return "document";
  return "general";
}
