export type PlanId = "free" | "pro" | "pro_plus" | "pro_max";

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  plan: PlanId;
  role: "user" | "admin";
  isSuspended: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DbConversation = {
  id: string;
  userId: string;
  title: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DbMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type DbUserSettings = {
  id: string;
  userId: string;
  theme: "dark" | "light" | "system";
  defaultModel: string | null;
  responseStyle: string | null;
  memoryEnabled: boolean;
  personaId: string;
  voiceEnabled: boolean;
  voiceAutoplay: boolean;
  voiceSpeed: number;
  voiceId: string;
  notifyEmail: boolean;
  notifyProduct: boolean;
  notifyUsage: boolean;
  onboardingCompleted: boolean;
  useCase: string | null;
  uiLocale: "uz" | "en" | "ru";
  createdAt: string;
  updatedAt: string;
};
