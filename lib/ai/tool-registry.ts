import type { BillingFeature } from "@/lib/billing/plans";
import { AI_TOOLS, isAiToolId, type AiToolId } from "@/lib/ai/tools";
import type { UsageTool } from "@/lib/usage/config";

export type ToolCapabilityId =
  | AiToolId
  | "web_search"
  | "voice"
  | "image_analysis";

export type UnifiedToolDefinition = {
  id: ToolCapabilityId;
  label: string;
  billingFeature: BillingFeature;
  usageTool: UsageTool | null;
  maxInputChars: number;
};

export const UNIFIED_TOOLS: UnifiedToolDefinition[] = [
  { id: "chat", label: "Chat", billingFeature: "chat", usageTool: "chat", maxInputChars: 12_000 },
  { id: "web_search", label: "Web qidiruv", billingFeature: "web_search", usageTool: "search", maxInputChars: 500 },
  { id: "image", label: "Rasm yaratish", billingFeature: "image", usageTool: "image", maxInputChars: 4_000 },
  { id: "documents", label: "Hujjat tahlili", billingFeature: "documents", usageTool: "documents", maxInputChars: 12_000 },
  { id: "translate", label: "Tarjima", billingFeature: "translate", usageTool: "translate", maxInputChars: 12_000 },
  { id: "summarizer", label: "Xulosa", billingFeature: "summarizer", usageTool: "summarizer", maxInputChars: 12_000 },
  { id: "writer", label: "Yozish", billingFeature: "writer", usageTool: "writer", maxInputChars: 12_000 },
  { id: "code", label: "Kod", billingFeature: "code", usageTool: "code", maxInputChars: 12_000 },
  { id: "voice", label: "Ovoz", billingFeature: "voice", usageTool: "voice", maxInputChars: 8_000 },
  { id: "image_analysis", label: "Rasm tahlili", billingFeature: "chat", usageTool: "chat", maxInputChars: 4_000 },
];

export function getUnifiedTool(id: string) {
  return UNIFIED_TOOLS.find((tool) => tool.id === id) ?? null;
}

export function validateToolInput(id: string, input: string) {
  const tool = getUnifiedTool(id);
  if (!tool) return { ok: false as const, error: "Noto'g'ri vosita tanlandi." };
  const text = input.trim();
  if (!text) return { ok: false as const, error: "Matn bo'sh bo'lmasligi kerak." };
  if (text.length > tool.maxInputChars) return { ok: false as const, error: "So'rov haddan tashqari katta." };
  return { ok: true as const, tool, text };
}

export function catalogToolIds(): AiToolId[] {
  return AI_TOOLS.map((tool) => tool.id);
}

export { isAiToolId };
