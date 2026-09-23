import type { AiModeId } from "@/lib/ai/modes";
import type { AiModelId } from "@/lib/ai/models";
import type { ModelSelectionId } from "@/lib/ai/auto-model";

export type ChatMode =
  | "chat"
  | "translate"
  | "write"
  | "code"
  | "image"
  | "docs";

export type { AiModeId, ModelSelectionId };

export type AttachmentClass = "IMAGE" | "DOCUMENT" | "UNSUPPORTED";

export type AttachmentFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: AttachmentClass;
  previewUrl?: string;
  file?: File;
  error?: string;
};

export type ChatSource = {
  title: string;
  url: string;
  snippet: string;
  domain?: string;
};

export type ChatMemoryRef = {
  id: string;
  content: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "notice";
  content: string;
  createdAt: string;
  attachments?: AttachmentFile[];
  liked?: boolean | null;
  usedMemories?: ChatMemoryRef[];
  sources?: ChatSource[];
  searchError?: string;
  usedModelId?: AiModelId;
  webSearchUsed?: boolean;
  errorCode?: string;
  errorDetail?: string;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  mode: ChatMode;
  aiMode: AiModeId;
  modelId: AiModelId;
  projectId?: string | null;
  messages: ChatMessage[];
  isDemo?: boolean;
  favorite?: boolean;
};

export type ChatSettings = {
  defaultModel: AiModelId;
  modelSelection: ModelSelectionId;
  responseStyle: "qisqa" | "muvozanatli" | "batafsil";
  notifications: boolean;
  emailNotifications: boolean;
  productUpdates: boolean;
  usageAlerts: boolean;
  memoryEnabled: boolean;
  personaId: string;
  voiceEnabled: boolean;
  voiceAutoplay: boolean;
  voiceSpeed: number;
  voiceId: string;
  webSearch: boolean;
  aiMode: AiModeId;
  onboardingCompleted?: boolean;
  useCase?: string;
};
