import type { ChatMode } from "@/types/chat";

export const AI_TOOL_IDS = [
  "chat",
  "image",
  "documents",
  "translate",
  "writer",
  "code",
  "summarizer",
] as const;

export type AiToolId = (typeof AI_TOOL_IDS)[number];

export type ToolDefinition = {
  id: AiToolId;
  mode: ChatMode;
  href: string;
  label: string;
  title: string;
  subtitle: string;
  systemAddon: string;
};

export const AI_TOOLS: ToolDefinition[] = [
  {
    id: "chat",
    mode: "chat",
    href: "/chat",
    label: "Chat",
    title: "AI Chat",
    subtitle: "Savol bering, g'oya yarating, o'rganing.",
    systemAddon: "",
  },
  {
    id: "translate",
    mode: "translate",
    href: "/tools/translate",
    label: "Tarjima",
    title: "Tarjima",
    subtitle: "Ma'noni saqlagan holda tillar o'rtasida tarjima qiling.",
    systemAddon:
      "You are operating as Nodir AI Translation. Translate accurately. Preserve meaning, names, and formatting. Do not add commentary unless asked. If the source language is auto-detected, infer it silently.",
  },
  {
    id: "writer",
    mode: "write",
    href: "/tools/writer",
    label: "Yozish",
    title: "Yozish yordamchisi",
    subtitle: "Xat, maqola, post va rasmiy matnlar yozing.",
    systemAddon:
      "You are operating as Nodir AI Writing Assistant. Produce polished writing in the requested format, tone, and length. Use Markdown when helpful. Do not invent facts, citations, or credentials.",
  },
  {
    id: "code",
    mode: "code",
    href: "/tools/code",
    label: "Kod",
    title: "Kod yordamchisi",
    subtitle: "Kod yozing, tushuntiring va yaxshilang.",
    systemAddon:
      "You are operating as Nodir AI Coding Assistant. Write correct, readable code. Explain briefly when asked. Never claim you executed the code. Do not include secrets. Prefer the requested language.",
  },
  {
    id: "image",
    mode: "image",
    href: "/tools/image",
    label: "Rasm",
    title: "Rasm yaratish",
    subtitle: "Fikringizni rasmga aylantiring.",
    systemAddon:
      "You are operating as Nodir AI Image prompt helper. If asked to generate an image, describe a precise visual prompt. Actual pixels are produced only by the image API.",
  },
  {
    id: "documents",
    mode: "docs",
    href: "/tools/documents",
    label: "Hujjatlar",
    title: "Hujjat tahlili",
    subtitle: "PDF, TXT va DOCX fayllarni tahlil qiling.",
    systemAddon:
      "You are operating as Nodir AI Document Analyst. Answer only from the provided document excerpts. If the excerpts are insufficient, say so. Never invent quotes from the file.",
  },
  {
    id: "summarizer",
    mode: "chat",
    href: "/tools/summarizer",
    label: "Xulosa",
    title: "Qisqartirish",
    subtitle: "Uzun matnni aniq xulosaga aylantiring.",
    systemAddon:
      "You are operating as Nodir AI Summarizer. Produce a faithful summary at the requested length. Do not add facts that are not in the source.",
  },
];

export function isAiToolId(value: string): value is AiToolId {
  return (AI_TOOL_IDS as readonly string[]).includes(value);
}

export function getTool(id: AiToolId) {
  return AI_TOOLS.find((tool) => tool.id === id) ?? AI_TOOLS[0];
}

export function toolByMode(mode: ChatMode) {
  return AI_TOOLS.find((tool) => tool.mode === mode) ?? AI_TOOLS[0];
}

export function systemPromptForTool(id: AiToolId) {
  return getTool(id).systemAddon;
}
