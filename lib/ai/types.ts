import type { AiModelId } from "@/lib/ai/models";
import type { ModelSelectionId } from "@/lib/ai/auto-model";
import type { AiToolId } from "@/lib/ai/tools";

export type AIMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ChatRequest = {
  conversationId?: string;
  messages: AIMessage[];
  model: ModelSelectionId;
  mode?: string;
  tool?: AiToolId;
  content?: string;
  regenerate?: boolean;
  retry?: boolean;
  editMessageId?: string;
  webSearch?: boolean;
  personaId?: string;
  responseStyle?: string;
  memoryEnabled?: boolean;
  images?: { mime: string; data: string }[];
};

export type ChatResponseError = {
  error: string;
  code: string;
};

export type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; code: string; message: string; category?: string; providerStatus?: number; providerCode?: string | null; providerType?: string | null }
  | { type: "memory"; items: { id: string; content: string }[] }
  | { type: "sources"; results: { title: string; url: string; snippet: string; domain?: string }[] }
  | { type: "search"; configured: boolean; error?: string }
  | { type: "model"; id: AiModelId; name: string; auto: boolean }
  | { type: "vision"; enabled: true };

/** @deprecated Use AIMessage */
export type AiMessage = AIMessage;
/** @deprecated Use ChatRequest */
export type ChatRequestBody = ChatRequest;
