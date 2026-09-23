import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { DbConversation, DbMessage, DbUserSettings, Profile } from "@/lib/db/types";
import type { ChatMessage, Conversation } from "@/types/chat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";

export function persistenceEnabled() {
  return isSupabaseConfigured();
}

async function readJson<T>(response: Response) {
  const json = (await response.json()) as T & { error?: string; code?: string };
  return { ok: response.ok, status: response.status, json };
}

export function toUiConversation(row: DbConversation, messages: ChatMessage[] = []): Conversation {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    mode: "chat",
    aiMode: "general",
    modelId: DEFAULT_MODEL_ID,
    projectId: row.projectId ?? null,
    messages,
  };
}

export function toUiMessage(row: DbMessage): ChatMessage {
  return {
    id: row.id,
    role: row.role === "system" ? "assistant" : row.role,
    content: row.content,
    createdAt: row.createdAt,
  };
}

export async function apiListConversations() {
  const result = await readJson<{ conversations?: DbConversation[]; error?: string }>(
    await fetch("/api/conversations"),
  );
  return result;
}

export async function apiCreateConversation(projectId?: string | null) {
  return readJson<{ conversation?: DbConversation; error?: string }>(
    await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectId ? { projectId } : {}),
    }),
  );
}

export async function apiGetConversation(id: string) {
  return readJson<{ conversation?: DbConversation; messages?: DbMessage[]; error?: string }>(
    await fetch(`/api/conversations/${id}`),
  );
}

export async function apiRenameConversation(id: string, title: string) {
  return readJson<{ conversation?: DbConversation; error?: string }>(
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }),
  );
}

export async function apiDeleteConversation(id: string) {
  return readJson<{ ok?: boolean; error?: string }>(
    await fetch(`/api/conversations/${id}`, { method: "DELETE" }),
  );
}

export async function apiGetProfile() {
  return readJson<{ profile?: Profile; error?: string }>(await fetch("/api/profile"));
}

export async function apiUpdateProfile(name: string) {
  return readJson<{ profile?: Profile; error?: string }>(
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),
  );
}

export async function apiGetSettings() {
  return readJson<{ settings?: DbUserSettings | null; error?: string }>(await fetch("/api/settings"));
}

export async function apiUpdateSettings(patch: {
  theme?: "dark" | "light" | "system";
  defaultModel?: string;
  responseStyle?: string;
  memoryEnabled?: boolean;
  personaId?: string;
  voiceEnabled?: boolean;
  voiceAutoplay?: boolean;
  voiceSpeed?: number;
  voiceId?: string;
  notifyEmail?: boolean;
  notifyProduct?: boolean;
  notifyUsage?: boolean;
  onboardingCompleted?: boolean;
  useCase?: string;
  uiLocale?: "uz" | "en" | "ru";
}) {
  return readJson<{ settings?: DbUserSettings; error?: string }>(
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  );
}
