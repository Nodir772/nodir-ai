"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { AI_MODELS, DEFAULT_MODEL_ID, type AiModelId } from "@/lib/ai/models";
import { AUTO_MODEL_ID, type ModelSelectionId } from "@/lib/ai/auto-model";
import { DEFAULT_AI_MODE, type AiModeId } from "@/lib/ai/modes";
import { toolByMode } from "@/lib/ai/tools";
import { createSseDecoder, parseStreamEvent } from "@/lib/ai/streaming";
import {
  apiCreateConversation,
  apiDeleteConversation,
  apiGetConversation,
  apiGetSettings,
  apiListConversations,
  apiRenameConversation,
  apiUpdateSettings,
  toUiConversation,
  toUiMessage,
} from "@/lib/chat/api";
import { generateTitle, isMeaningfulMessage } from "@/lib/chat/title";
import { CHAT_MODES } from "@/lib/chat/modes";
import { DEMO_CONVERSATIONS } from "@/lib/chat/demo-data";
import { DB_ERRORS } from "@/lib/db/errors";
import { useIsClient } from "@/hooks/useMounted";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/toast-context";
import { bytesToBase64 } from "@/lib/files/base64";
import { classifyAttachment } from "@/lib/files/classify";
import type { AttachmentFile, ChatMessage, ChatMode, ChatSettings, Conversation } from "@/types/chat";

const STORAGE_KEY = "nodir-ai:conversations";
const SETTINGS_KEY = "nodir-ai:chat-settings";
const ACTIVE_KEY = "nodir-ai:active-conversation";

async function imagesFromAttachments(attachments: AttachmentFile[] | undefined) {
  const images: { mime: string; data: string }[] = [];
  for (const file of attachments ?? []) {
    if (!file.file) continue;
    const bytes = new Uint8Array(await file.file.arrayBuffer());
    const classified = classifyAttachment(bytes, file.name, file.type);
    if (!classified.ok || classified.class !== "IMAGE" || !classified.mime) continue;
    images.push({ mime: classified.mime, data: bytesToBase64(bytes) });
  }
  return images;
}

function stripFailedTail(messages: ChatMessage[]) {
  const next = [...messages];
  while (next.length) {
    const last = next[next.length - 1];
    const failedAssistant =
      last.role === "assistant" && Boolean(last.errorCode || !last.content.trim());
    if (last.role === "notice" || failedAssistant) {
      next.pop();
      continue;
    }
    break;
  }
  return next;
}

const defaultSettings: ChatSettings = {
  defaultModel: DEFAULT_MODEL_ID,
  modelSelection: DEFAULT_MODEL_ID,
  responseStyle: "muvozanatli",
  notifications: true,
  emailNotifications: false,
  productUpdates: false,
  usageAlerts: false,
  memoryEnabled: false,
  personaId: "nodir",
  voiceEnabled: false,
  voiceAutoplay: false,
  voiceSpeed: 1,
  voiceId: "alloy",
  webSearch: true,
  aiMode: DEFAULT_AI_MODE,
  onboardingCompleted: false,
  useCase: "",
};

export type StreamingState = {
  conversationId: string;
  messageId: string;
  content: string;
} | null;

type ChatContextValue = {
  hydrated: boolean;
  loadingConversations: boolean;
  loadingMessages: boolean;
  creatingConversation: boolean;
  persistence: boolean;
  conversations: Conversation[];
  activeId: string | null;
  active: Conversation | null;
  generating: boolean;
  streaming: StreamingState;
  settings: ChatSettings;
  modelId: AiModelId;
  modelSelection: ModelSelectionId;
  setModelId: (id: AiModelId) => void;
  setModelSelection: (id: ModelSelectionId) => void;
  setMode: (mode: ChatMode) => void;
  setAiMode: (mode: AiModeId) => void;
  createConversation: (mode?: ChatMode, projectId?: string | null) => Promise<string>;
  selectConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  sendMessage: (text: string, attachments: AttachmentFile[]) => Promise<boolean>;
  stopGeneration: () => void;
  regenerate: (assistantMessageId?: string) => Promise<void>;
  retryLast: () => Promise<void>;
  editUserMessage: (messageId: string, content: string) => Promise<void>;
  connectionInterrupted: boolean;
  setMessageLiked: (messageId: string, liked: boolean | null) => void;
  updateSettings: (patch: Partial<ChatSettings>) => Promise<void>;
  persistTheme: (theme: "dark" | "light" | "system") => Promise<void>;
  clearHistory: () => void;
  deleteAllConversations: () => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

function createBlankConversation(
  mode: ChatMode = "chat",
  modelId: AiModelId = DEFAULT_MODEL_ID,
  projectId?: string | null,
): Conversation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "Yangi suhbat",
    createdAt: now,
    updatedAt: now,
    mode,
    aiMode: DEFAULT_AI_MODE,
    modelId,
    projectId: projectId ?? null,
    messages: [],
  };
}

function readConversations(): Conversation[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEMO_CONVERSATIONS;
  try {
    return JSON.parse(stored) as Conversation[];
  } catch {
    return DEMO_CONVERSATIONS;
  }
}

function readSettings(): ChatSettings {
  const storedSettings = localStorage.getItem(SETTINGS_KEY);
  if (!storedSettings) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(storedSettings) } as ChatSettings;
  } catch {
    return defaultSettings;
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const isClient = useIsClient();
  const { supabaseConfigured } = useAuth();
  const persistence = supabaseConfigured;
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const router = useRouter();
  const params = useParams<{ conversationId?: string }>();
  const searchParams = useSearchParams();
  const routeConversationId = typeof params.conversationId === "string" ? params.conversationId : undefined;
  const modeParam = searchParams.get("mode");
  const initialMode = CHAT_MODES.some((item) => item.id === modeParam)
    ? (modeParam as ChatMode)
    : undefined;

  const [hydrated, setHydrated] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(persistence);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(routeConversationId ?? null);
  const [generating, setGenerating] = useState(false);
  const [streaming, setStreaming] = useState<StreamingState>(null);
  const [connectionInterrupted, setConnectionInterrupted] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>(defaultSettings);
  const [modelId, setModelIdState] = useState<AiModelId>(DEFAULT_MODEL_ID);
  const [modelSelection, setModelSelectionState] = useState<ModelSelectionId>(DEFAULT_MODEL_ID);
  const abortRef = useRef<AbortController | null>(null);
  const generatingRef = useRef(false);
  const retryRef = useRef<{ conversationId: string; history: ChatMessage[]; model: AiModelId } | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const settingsRef = useRef<ChatSettings>(defaultSettings);
  const activeIdRef = useRef<string | null>(routeConversationId ?? null);
  const initialRouteRef = useRef(routeConversationId);

  useEffect(() => {
    conversationsRef.current = conversations;
    settingsRef.current = settings;
    activeIdRef.current = activeId;
  }, [conversations, activeId, settings]);

  if (isClient && !hydrated) {
    const nextSettings = readSettings();
    setSettings(nextSettings);
    setModelIdState(nextSettings.defaultModel ?? DEFAULT_MODEL_ID);
    setModelSelectionState(nextSettings.modelSelection ?? nextSettings.defaultModel ?? DEFAULT_MODEL_ID);
    if (!persistence) {
      setConversations(readConversations());
      setActiveId(localStorage.getItem(ACTIVE_KEY));
      if (initialMode) {
        const next = createBlankConversation(initialMode, nextSettings.defaultModel ?? DEFAULT_MODEL_ID);
        setConversations((items) => [next, ...items]);
        setActiveId(next.id);
      }
    }
    setHydrated(true);
  }

  useEffect(() => {
    if (!hydrated || persistence) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations, hydrated, persistence]);

  useEffect(() => {
    if (!hydrated) return;
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, hydrated]);

  useEffect(() => {
    if (!hydrated || !persistence) return;
    let cancelled = false;

    async function loadRemote() {
      setLoadingConversations(true);
      const [list, remoteSettings] = await Promise.all([apiListConversations(), apiGetSettings()]);
      if (cancelled) return;
      if (!list.ok) {
        toast(list.json.error ?? DB_ERRORS.load, "error");
        setLoadingConversations(false);
        return;
      }
      const rows = (list.json.conversations ?? []).map((row) => toUiConversation(row));
      let nextRows = rows;
      try {
        const favRes = await fetch("/api/favorites");
        if (favRes.ok) {
          const favJson = (await favRes.json()) as { favorites?: { item_type?: string; item_id?: string }[] };
          const ids = new Set(
            (favJson.favorites ?? [])
              .filter((item) => item.item_type === "conversation" && item.item_id)
              .map((item) => item.item_id as string),
          );
          nextRows = rows.map((row) => ({ ...row, favorite: ids.has(row.id) }));
        }
      } catch {
        nextRows = rows;
      }
      setConversations(nextRows);
      if (remoteSettings.ok && remoteSettings.json.settings) {
        const saved = remoteSettings.json.settings;
        const nextModel = saved.defaultModel && AI_MODELS.some((model) => model.id === saved.defaultModel)
          ? (saved.defaultModel as AiModelId)
          : DEFAULT_MODEL_ID;
        setSettings((current) => ({
          ...current,
          defaultModel: nextModel,
          responseStyle: (saved.responseStyle as ChatSettings["responseStyle"]) || current.responseStyle,
          memoryEnabled: Boolean(saved.memoryEnabled),
          personaId: saved.personaId || current.personaId,
          voiceEnabled: Boolean(saved.voiceEnabled),
          voiceAutoplay: Boolean(saved.voiceAutoplay),
          voiceSpeed: typeof saved.voiceSpeed === "number" ? saved.voiceSpeed : current.voiceSpeed,
          voiceId: saved.voiceId || current.voiceId,
          emailNotifications: Boolean(saved.notifyEmail),
          productUpdates: Boolean(saved.notifyProduct),
          usageAlerts: Boolean(saved.notifyUsage),
          onboardingCompleted: Boolean(saved.onboardingCompleted),
          useCase: saved.useCase || current.useCase,
          modelSelection: current.modelSelection,
        }));
        setModelIdState(nextModel);
        if (saved.theme === "dark" || saved.theme === "light" || saved.theme === "system") {
          setTheme(saved.theme);
        }
      }
      const preferred = initialRouteRef.current && nextRows.some((row) => row.id === initialRouteRef.current)
        ? initialRouteRef.current
        : nextRows[0]?.id ?? null;
      setActiveId(preferred);
      if (preferred) {
        router.replace(`/chat/${preferred}`, { scroll: false });
      }
      setLoadingConversations(false);
      if (preferred) {
        setLoadingMessages(true);
        const detail = await apiGetConversation(preferred);
        if (!cancelled && detail.ok) {
          const messages = (detail.json.messages ?? []).map(toUiMessage);
          setConversations((items) =>
            items.map((item) => (item.id === preferred ? { ...item, messages } : item)),
          );
        }
        if (!cancelled) setLoadingMessages(false);
      }
    }

    void loadRemote();
    return () => {
      cancelled = true;
    };
  }, [hydrated, persistence, toast, router, setTheme]);

  const active = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? null,
    [conversations, activeId],
  );

  const patchConversation = useCallback((id: string, updater: (item: Conversation) => Conversation) => {
    setConversations((items) => items.map((item) => (item.id === id ? updater(item) : item)));
  }, [setConversations]);

  const createConversation = useCallback(
    async (mode: ChatMode = "chat", projectId?: string | null) => {
      setCreatingConversation(true);
      try {
        if (persistence) {
          const result = await apiCreateConversation(projectId);
          if (!result.ok || !result.json.conversation) {
            toast(result.json.error ?? DB_ERRORS.save, "error");
            return "";
          }
          const next = toUiConversation(result.json.conversation);
          next.mode = mode;
          next.aiMode = settingsRef.current.aiMode;
          next.projectId = projectId ?? next.projectId ?? null;
          setConversations((items) => [next, ...items]);
          setActiveId(next.id);
          router.replace(`/chat/${next.id}`, { scroll: false });
          return next.id;
        }
        const next = createBlankConversation(mode, modelId, projectId);
        next.aiMode = settingsRef.current.aiMode;
        setConversations((items) => [next, ...items]);
        setActiveId(next.id);
        return next.id;
      } finally {
        setCreatingConversation(false);
      }
    },
    [modelId, persistence, toast, router, setCreatingConversation, setConversations, setActiveId],
  );

  useEffect(() => {
    function onNew() {
      void createConversation("chat");
    }
    window.addEventListener("nodir-new-chat", onNew);
    return () => window.removeEventListener("nodir-new-chat", onNew);
  }, [createConversation]);

  const selectConversation = useCallback(
    async (id: string) => {
      setActiveId(id);
      const found = conversationsRef.current.find((item) => item.id === id);
      if (found) setModelIdState(found.modelId);
      if (persistence) {
        router.replace(`/chat/${id}`, { scroll: false });
      }
      if (!persistence) return;
      setLoadingMessages(true);
      const detail = await apiGetConversation(id);
      if (!detail.ok) {
        toast(detail.json.error ?? DB_ERRORS.load, "error");
        setLoadingMessages(false);
        return;
      }
      const messages = (detail.json.messages ?? []).map(toUiMessage);
      patchConversation(id, (item) => ({
        ...item,
        title: detail.json.conversation?.title ?? item.title,
        updatedAt: detail.json.conversation?.updatedAt ?? item.updatedAt,
        messages,
      }));
      setLoadingMessages(false);
    },
    [persistence, patchConversation, toast, router, setActiveId, setModelIdState, setLoadingMessages],
  );

  useEffect(() => {
    if (!hydrated || !persistence || !routeConversationId) return;
    if (activeIdRef.current === routeConversationId) return;
    void selectConversation(routeConversationId);
  }, [hydrated, persistence, routeConversationId, selectConversation]);

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      const nextTitle = title.trim() || "Yangi suhbat";
      const previous = conversationsRef.current.find((item) => item.id === id)?.title;
      patchConversation(id, (item) => ({
        ...item,
        title: nextTitle,
        updatedAt: new Date().toISOString(),
        isDemo: false,
      }));
      if (!persistence) return;
      const result = await apiRenameConversation(id, nextTitle);
      if (!result.ok) {
        patchConversation(id, (item) => ({ ...item, title: previous ?? "Yangi suhbat" }));
        toast(result.json.error ?? DB_ERRORS.save, "error");
      }
    },
    [persistence, patchConversation, toast],
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      if (persistence) {
        const result = await apiDeleteConversation(id);
        if (!result.ok) {
          toast(result.json.error ?? DB_ERRORS.save, "error");
          return;
        }
      }
      setConversations((items) => items.filter((item) => item.id !== id));
      setActiveId((current) => (current === id ? null : current));
      await createConversation();
    },
    [createConversation, persistence, toast, setConversations, setActiveId],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const current = Boolean(conversationsRef.current.find((item) => item.id === id)?.favorite);
      patchConversation(id, (item) => ({ ...item, favorite: !item.favorite }));
      if (!current) {
        void fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType: "conversation", itemId: id }),
        }).catch(() => undefined);
      } else {
        void fetch(`/api/favorites?itemType=conversation&itemId=${id}`, { method: "DELETE" }).catch(() => undefined);
      }
    },
    [patchConversation],
  );

  const finishAssistant = useCallback(
    (
      conversationId: string,
      messageId: string,
      content: string,
      asNotice = false,
      extra?: Pick<
        ChatMessage,
        "usedMemories" | "sources" | "searchError" | "usedModelId" | "webSearchUsed" | "errorCode" | "errorDetail"
      >,
    ) => {
      setConversations((items) =>
        items
          .map((item) =>
            item.id === conversationId
              ? {
                  ...item,
                  updatedAt: new Date().toISOString(),
                  messages: item.messages.map((message) =>
                    message.id === messageId
                      ? {
                          ...message,
                          role: (asNotice ? "notice" : "assistant") as ChatMessage["role"],
                          content,
                          ...extra,
                        }
                      : message,
                  ),
                }
              : item,
          )
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      );
      setStreaming(null);
    },
    [setConversations, setStreaming],
  );

  const requestAi = useCallback(
    async (
      conversationId: string,
      history: ChatMessage[],
      selectedModel: AiModelId,
      options?: { regenerate?: boolean; retry?: boolean; content?: string; editMessageId?: string; images?: { mime: string; data: string }[] },
    ) => {
      if (generatingRef.current) return false;
      generatingRef.current = true;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setGenerating(true);

      const assistantId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };

      patchConversation(conversationId, (item) => ({
        ...item,
        messages: [...item.messages, assistantMessage],
        updatedAt: new Date().toISOString(),
      }));
      setStreaming({ conversationId, messageId: assistantId, content: "" });

      const tool = toolByMode(conversationsRef.current.find((item) => item.id === conversationId)?.mode ?? "chat").id;
      const selection = modelSelection;
      const payload = persistence
        ? {
            conversationId,
            model: selection,
            content: options?.regenerate || options?.retry ? undefined : options?.content,
            regenerate: Boolean(options?.regenerate),
            retry: Boolean(options?.retry),
            editMessageId: options?.editMessageId,
            tool,
            mode: settingsRef.current.aiMode,
            webSearch: settingsRef.current.webSearch,
            personaId: settingsRef.current.personaId,
            responseStyle: settingsRef.current.responseStyle,
            memoryEnabled: settingsRef.current.memoryEnabled,
            images: options?.images,
          }
        : {
            conversationId,
            model: selection,
            tool,
            mode: settingsRef.current.aiMode,
            webSearch: settingsRef.current.webSearch,
            personaId: settingsRef.current.personaId,
            responseStyle: settingsRef.current.responseStyle,
            memoryEnabled: settingsRef.current.memoryEnabled,
            images: options?.images,
            messages: history
              .filter((message) => message.role === "user" || message.role === "assistant")
              .map((message) => ({ role: message.role, content: message.content })),
          };

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(payload),
        });

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("text/event-stream")) {
          const json = (await response.json()) as { error?: string; code?: string; detail?: string };
          if (json.code === "USAGE_LIMIT" || json.code === "PLAN_REQUIRED" || json.code === "FEATURE_DISABLED") {
            const { handleBillingResponse } = await import("@/components/billing/UpgradeModal");
            handleBillingResponse(json);
          }
          finishAssistant(
            conversationId,
            assistantId,
            json.error ?? "AI bilan bog'lanishda xatolik yuz berdi.",
            true,
            { errorCode: json.code, errorDetail: json.detail },
          );
          return true;
        }

        if (!response.body) {
          finishAssistant(conversationId, assistantId, "AI bilan bog'lanishda xatolik yuz berdi.", true);
          return true;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const sse = createSseDecoder();
        let produced = "";
        let usedMemories: ChatMessage["usedMemories"];
        let sources: ChatMessage["sources"];
        let searchError: string | undefined;
        let usedModelId: AiModelId | undefined;
        let raf = 0;
        const flush = () => {
          raf = 0;
          setStreaming({ conversationId, messageId: assistantId, content: produced });
        };

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const pieces = sse.push(decoder.decode(value, { stream: true }));
            for (const piece of pieces) {
              const event = parseStreamEvent(piece);
              if (!event) continue;
              if (event.type === "delta") {
                produced += event.text;
                if (!raf) raf = requestAnimationFrame(flush);
              } else if (event.type === "memory") {
                usedMemories = event.items;
              } else if (event.type === "sources") {
                sources = event.results;
              } else if (event.type === "search") {
                searchError = event.error;
              } else if (event.type === "model") {
                usedModelId = event.id;
                setModelIdState(event.id);
              } else if (event.type === "error") {
                finishAssistant(
                  conversationId,
                  assistantId,
                  produced.trim() ? produced : event.message,
                  true,
                  {
                    usedMemories,
                    sources,
                    searchError,
                    usedModelId,
                    webSearchUsed: Boolean(sources?.length || searchError),
                    errorCode: event.code,
                  },
                );
                return true;
              } else if (event.type === "done") {
                finishAssistant(conversationId, assistantId, produced, !produced.trim(), {
                  usedMemories,
                  sources,
                  searchError,
                  usedModelId,
                  webSearchUsed: Boolean(sources?.length || searchError),
                });
                return true;
              }
            }
          }
        } catch (streamError) {
          if (raf) cancelAnimationFrame(raf);
          if (streamError instanceof DOMException && streamError.name === "AbortError") {
            if (produced.trim()) {
              finishAssistant(conversationId, assistantId, produced, true);
            } else {
              patchConversation(conversationId, (item) => ({
                ...item,
                messages: item.messages.filter((message) => message.id !== assistantId),
              }));
              setStreaming(null);
            }
            return true;
          }
          throw streamError;
        }

        finishAssistant(
          conversationId,
          assistantId,
          produced.trim() ? produced : "AI javob qaytarmadi. Iltimos, qayta urinib ko'ring.",
          !produced.trim(),
          { usedMemories, sources, searchError, usedModelId, webSearchUsed: Boolean(sources?.length || searchError) },
        );
        return Boolean(produced.trim());
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          patchConversation(conversationId, (item) => ({
            ...item,
            messages: item.messages.filter((message) => message.id !== assistantId || message.content),
          }));
          setStreaming(null);
          return true;
        }
        patchConversation(conversationId, (item) => ({
          ...item,
          messages: item.messages.filter((message) => message.id !== assistantId),
        }));
        setStreaming(null);
        setConnectionInterrupted(true);
        return false;
      } finally {
        generatingRef.current = false;
        setGenerating(false);
        abortRef.current = null;
      }
    },
    [finishAssistant, patchConversation, persistence, modelSelection, setGenerating, setStreaming, setConnectionInterrupted, setModelIdState],
  );

  const sendMessage = useCallback(
    async (text: string, attachments: AttachmentFile[]) => {
      if (generatingRef.current) return false;
      const content = text.trim();
      if (!content && attachments.length === 0) return false;

      const images = await imagesFromAttachments(attachments);

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content || (images.length ? "Rasmni tahlil qiling." : "Fayl biriktirildi."),
        createdAt: new Date().toISOString(),
        attachments,
      };

      let base = active;
      if (!base) {
        const id = await createConversation("chat");
        if (!id) return false;
        base = {
          ...createBlankConversation("chat", modelId),
          id,
        };
      }

      const nextMessages = [...base.messages.filter((message) => message.role !== "notice"), userMessage];
      const nextTitle =
        base.title === "Yangi suhbat" && isMeaningfulMessage(userMessage.content)
          ? generateTitle(userMessage.content)
          : base.title;

      setConversations((items) => {
        const exists = items.some((item) => item.id === base!.id);
        const list = exists ? items : [base!, ...items];
        return list.map((item) =>
          item.id === base!.id
            ? {
                ...item,
                title: nextTitle,
                messages: nextMessages,
                modelId,
                updatedAt: new Date().toISOString(),
                isDemo: false,
              }
            : item,
        );
      });
      setActiveId(base.id);
      setConnectionInterrupted(false);
      retryRef.current = { conversationId: base.id, history: nextMessages, model: modelId };
      const delivered = await requestAi(base.id, nextMessages, modelId, {
        content: userMessage.content,
        images: images.length ? images : undefined,
      });
      return delivered;
    },
    [active, createConversation, modelId, requestAi, setConversations, setActiveId, setConnectionInterrupted],
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    generatingRef.current = false;
    setGenerating(false);
  }, [setGenerating]);

  const regenerate = useCallback(async (assistantMessageId?: string) => {
    if (!active || generatingRef.current) return;
    const withoutTail = [...active.messages];
    if (assistantMessageId) {
      const index = withoutTail.findIndex((message) => message.id === assistantMessageId);
      if (index < 0) return;
      let userIndex = index - 1;
      while (userIndex >= 0 && withoutTail[userIndex]?.role !== "user") userIndex -= 1;
      if (userIndex < 0) return;
      withoutTail.splice(userIndex + 1);
    } else {
      while (withoutTail.length && withoutTail[withoutTail.length - 1]?.role !== "user") {
        withoutTail.pop();
      }
    }
    patchConversation(active.id, (item) => ({ ...item, messages: withoutTail }));
    retryRef.current = { conversationId: active.id, history: withoutTail, model: modelId };
    await requestAi(active.id, withoutTail, modelId, { regenerate: true });
  }, [active, modelId, patchConversation, requestAi]);

  const retryLast = useCallback(async () => {
    const pending = retryRef.current;
    if (!pending || generatingRef.current) return;
    setConnectionInterrupted(false);

    const live = conversationsRef.current.find((item) => item.id === pending.conversationId);
    const last = live?.messages.at(-1);
    if (last?.errorCode === "MISSING_API_KEY") {
      try {
        const response = await fetch("/api/ai/status");
        const json = (await response.json()) as { openaiConfigured?: boolean };
        if (!json.openaiConfigured) {
          toast("Server konfiguratsiyasida OPENAI_API_KEY mavjud emas.", "error");
          return;
        }
      } catch {
        toast("Konfiguratsiyani tekshirib bo'lmadi.", "error");
        return;
      }
    }

    const cleaned = stripFailedTail(live?.messages ?? pending.history);
    patchConversation(pending.conversationId, (item) => ({ ...item, messages: stripFailedTail(item.messages) }));
    const lastUser = [...cleaned].reverse().find((message) => message.role === "user");
    const images = await imagesFromAttachments(lastUser?.attachments);
    await requestAi(pending.conversationId, cleaned, pending.model, {
      retry: true,
      content: lastUser?.content,
      images: images.length ? images : undefined,
    });
  }, [requestAi, patchConversation, setConnectionInterrupted, toast]);

  const editUserMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!active || generatingRef.current) return;
      const next = content.trim();
      if (!next) return;
      const index = active.messages.findIndex((message) => message.id === messageId && message.role === "user");
      if (index < 0) return;
      const truncated = active.messages.slice(0, index + 1).map((message, idx) =>
        idx === index ? { ...message, content: next } : message,
      );
      const title =
        active.title === "Yangi suhbat" && isMeaningfulMessage(next) ? generateTitle(next) : active.title;
      patchConversation(active.id, (item) => ({ ...item, title, messages: truncated }));
      retryRef.current = { conversationId: active.id, history: truncated, model: modelId };
      await requestAi(active.id, truncated, modelId, { editMessageId: messageId, content: next });
    },
    [active, modelId, patchConversation, requestAi],
  );

  const setMessageLiked = useCallback(
    (messageId: string, liked: boolean | null) => {
      if (!active) return;
      patchConversation(active.id, (item) => ({
        ...item,
        messages: item.messages.map((message) =>
          message.id === messageId ? { ...message, liked } : message,
        ),
      }));
      if (liked === true) {
        void fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType: "message", itemId: messageId }),
        }).catch(() => undefined);
      } else {
        void fetch(`/api/favorites?itemType=message&itemId=${messageId}`, { method: "DELETE" }).catch(
          () => undefined,
        );
      }
      const conversationId = active.id;
      void fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          conversationId,
          rating: liked === true ? "like" : liked === false ? "dislike" : null,
        }),
      }).catch(() => undefined);
    },
    [active, patchConversation],
  );

  const setMode = useCallback(
    (mode: ChatMode) => {
      if (active) {
        patchConversation(active.id, (item) => ({ ...item, mode }));
        return;
      }
      void createConversation(mode);
    },
    [active, createConversation, patchConversation],
  );

  const setAiMode = useCallback(
    (mode: AiModeId) => {
      setSettings((current) => ({ ...current, aiMode: mode }));
      if (active) patchConversation(active.id, (item) => ({ ...item, aiMode: mode }));
    },
    [active, patchConversation, setSettings],
  );

  const setModelId = useCallback(
    (id: AiModelId) => {
      setModelIdState(id);
      setModelSelectionState(id);
      setSettings((current) => ({ ...current, defaultModel: id, modelSelection: id }));
      if (active) {
        patchConversation(active.id, (item) => ({ ...item, modelId: id }));
      }
    },
    [active, patchConversation, setModelIdState, setModelSelectionState, setSettings],
  );

  const setModelSelection = useCallback(
    (id: ModelSelectionId) => {
      setModelSelectionState(id);
      setSettings((current) => ({ ...current, modelSelection: id }));
      if (id !== AUTO_MODEL_ID) {
        setModelIdState(id);
        setSettings((current) => ({ ...current, defaultModel: id, modelSelection: id }));
        if (active) patchConversation(active.id, (item) => ({ ...item, modelId: id }));
      }
    },
    [active, patchConversation, setModelIdState, setModelSelectionState, setSettings],
  );

  const updateSettings = useCallback(
    async (patch: Partial<ChatSettings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      if (patch.defaultModel) setModelIdState(patch.defaultModel);
      if (!persistence) return;
      const result = await apiUpdateSettings({
        defaultModel: next.defaultModel,
        responseStyle: next.responseStyle,
        memoryEnabled: next.memoryEnabled,
        personaId: next.personaId,
        voiceEnabled: next.voiceEnabled,
        voiceAutoplay: next.voiceAutoplay,
        voiceSpeed: next.voiceSpeed,
        voiceId: next.voiceId,
        notifyEmail: next.emailNotifications,
        notifyProduct: next.productUpdates,
        notifyUsage: next.usageAlerts,
        onboardingCompleted: next.onboardingCompleted,
        useCase: next.useCase,
      });
      if (!result.ok) {
        toast(result.json.error ?? DB_ERRORS.save, "error");
      }
    },
    [persistence, settings, toast, setSettings, setModelIdState],
  );

  const persistTheme = useCallback(
    async (theme: "dark" | "light" | "system") => {
      setTheme(theme);
      if (!persistence) return;
      const result = await apiUpdateSettings({ theme });
      if (!result.ok) toast(result.json.error ?? DB_ERRORS.save, "error");
    },
    [persistence, setTheme, toast],
  );

  const clearHistory = useCallback(() => {
    setConversations([]);
    setActiveId(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_KEY);
  }, [setConversations, setActiveId]);

  const deleteAllConversations = useCallback(async () => {
    if (persistence) {
      await fetch("/api/conversations/all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
    }
    clearHistory();
  }, [clearHistory, persistence]);

  const value = useMemo(
    () => ({
      hydrated,
      loadingConversations,
      loadingMessages,
      creatingConversation,
      persistence,
      conversations,
      activeId,
      active,
      generating,
      streaming,
      connectionInterrupted,
      settings,
      modelId,
      modelSelection,
      setModelId,
      setModelSelection,
      setMode,
      setAiMode,
      createConversation,
      selectConversation,
      renameConversation,
      deleteConversation,
      toggleFavorite,
      sendMessage,
      stopGeneration,
      regenerate,
      retryLast,
      editUserMessage,
      setMessageLiked,
      updateSettings,
      persistTheme,
      clearHistory,
      deleteAllConversations,
    }),
    [
      hydrated,
      loadingConversations,
      loadingMessages,
      creatingConversation,
      persistence,
      conversations,
      activeId,
      active,
      generating,
      streaming,
      connectionInterrupted,
      settings,
      modelId,
      modelSelection,
      setModelId,
      setModelSelection,
      setMode,
      setAiMode,
      createConversation,
      selectConversation,
      renameConversation,
      deleteConversation,
      toggleFavorite,
      sendMessage,
      stopGeneration,
      regenerate,
      retryLast,
      editUserMessage,
      setMessageLiked,
      updateSettings,
      persistTheme,
      clearHistory,
      deleteAllConversations,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}
