"use client";

import { useEffect, useRef, useState } from "react";
import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageBubble } from "@/components/chat/ChatMessage";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { SettingsModal } from "@/components/chat/SettingsModal";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { useChat } from "@/components/chat/ChatProvider";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/toast-context";
import { LimitModal } from "@/components/workspace/LimitModal";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { MessageSkeleton } from "@/components/ui/loaders";
import { RetryButton } from "@/components/ui/ErrorState";
import { consumePendingPrompt } from "@/lib/pending-prompt";
import { useIsClient } from "@/hooks/useMounted";
import { uploadFormData } from "@/lib/files/upload";
import { partitionAttachments } from "@/lib/files/partition";
import {
  conversationToJson,
  conversationToMarkdown,
  conversationToText,
  downloadText,
} from "@/lib/export/conversation";
import type { AttachmentFile } from "@/types/chat";

export function ChatWorkspace() {
  const {
    hydrated,
    active,
    conversations,
    generating,
    streaming,
    loadingMessages,
    sendMessage,
    stopGeneration,
    regenerate,
    retryLast,
    connectionInterrupted,
    setMessageLiked,
    editUserMessage,
    renameConversation,
    deleteConversation,
  } = useChat();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shareContent, setShareContent] = useState<string | null>(null);
  const [pendingReady, setPendingReady] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [olderFor, setOlderFor] = useState<string | null>(null);
  const [jumpDown, setJumpDown] = useState(false);
  const uploadAbort = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const isClient = useIsClient();

  if (isClient && !pendingReady) {
    setPendingReady(true);
    const pending = consumePendingPrompt();
    if (pending?.text) {
      setDraft(pending.text);
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const node = threadRef.current;
    if (!node || !stickToBottom.current) return;
    node.scrollTop = node.scrollHeight;
  }, [active?.messages.length, generating, streaming?.content]);

  useEffect(() => {
    if (active && active.messages.length === 0) {
      inputRef.current?.focus();
    }
  }, [active]);

  const messages = (active?.messages ?? []).map((message) =>
    streaming && message.id === streaming.messageId
      ? { ...message, content: streaming.content }
      : message,
  );
  const showEmpty = hydrated && !loadingMessages && messages.length === 0 && !generating;
  const showTyping = Boolean(generating && streaming && !streaming.content);

  const WINDOW = 80;
  const showOlder = olderFor === active?.id;
  const visibleMessages = showOlder || messages.length <= WINDOW ? messages : messages.slice(-WINDOW);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden lg:flex">
        <ChatSidebar
          onSettings={() => setSettingsOpen(true)}
          onRename={(id) => {
            const item = conversations.find((conversation) => conversation.id === id);
            setRenameId(id);
            setRenameValue(item?.title ?? "");
          }}
          onDelete={setDeleteId}
          onShare={(id) => {
            const item = conversations.find((conversation) => conversation.id === id);
            if (item) setShareContent(conversationToMarkdown(item.title, item.updatedAt, item.messages));
          }}
          onExport={(id) => {
            const item = conversations.find((conversation) => conversation.id === id);
            if (!item) return;
            downloadText(
              `${item.title}.json`,
              conversationToJson(item.title, item.updatedAt, item.messages),
              "application/json",
            );
            toast("Eksport yuklandi", "success");
          }}
        />
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Yon panelni yopish"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative h-full w-[min(100%,270px)] translate-x-0 bg-secondary shadow-2xl transition">
            <ChatSidebar
              onClose={() => setSidebarOpen(false)}
              onSettings={() => {
                setSidebarOpen(false);
                setSettingsOpen(true);
              }}
              onRename={(id) => {
                const item = conversations.find((conversation) => conversation.id === id);
                setSidebarOpen(false);
                setRenameId(id);
                setRenameValue(item?.title ?? "");
              }}
              onDelete={(id) => {
                setSidebarOpen(false);
                setDeleteId(id);
              }}
              onShare={(id) => {
                const item = conversations.find((conversation) => conversation.id === id);
                setSidebarOpen(false);
                if (item) setShareContent(conversationToMarkdown(item.title, item.updatedAt, item.messages));
              }}
              onExport={(id) => {
                const item = conversations.find((conversation) => conversation.id === id);
                setSidebarOpen(false);
                if (!item) return;
                downloadText(
                  `${item.title}.txt`,
                  conversationToText(item.title, item.updatedAt, item.messages),
                  "text/plain",
                );
                toast("Eksport yuklandi", "success");
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <ChatHeader onMenu={() => setSidebarOpen(true)} onSettings={() => setSettingsOpen(true)} />
        <div
          ref={threadRef}
          className="min-h-0 flex-1 overflow-y-auto"
          onScroll={(event) => {
            const node = event.currentTarget;
            const atBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
            stickToBottom.current = atBottom;
            setJumpDown(!atBottom && node.scrollHeight > node.clientHeight + 120);
          }}
        >
          {loadingMessages ? (
            <MessageSkeleton />
          ) : showEmpty ? (
            <ChatEmptyState
              onSelect={(text) => {
                setDraft(text);
                inputRef.current?.focus();
              }}
            />
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
              {messages.length > WINDOW && !showOlder ? (
                <button
                  type="button"
                  className="mx-auto rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
                  onClick={() => setOlderFor(active?.id ?? null)}
                >
                  Avvalgi xabarlarni ko&apos;rsatish ({messages.length - WINDOW})
                </button>
              ) : null}
              {visibleMessages.map((message) => (
                <ChatMessageBubble
                  key={message.id}
                  message={message}
                  generating={generating}
                  isStreaming={streaming?.messageId === message.id}
                  onRegenerate={() => void regenerate(message.id)}
                  onLike={(value) => setMessageLiked(message.id, value)}
                  onShare={() => setShareContent(message.content)}
                  onEdit={
                    message.role === "user"
                      ? (content) => void editUserMessage(message.id, content)
                      : undefined
                  }
                  onRetry={message.role === "notice" ? () => void retryLast() : undefined}
                  compact={message.id === messages.at(-1)?.id && message.role === "assistant"}
                />
              ))}
              {showTyping ? <TypingIndicator onStop={stopGeneration} /> : null}
            </div>
          )}
        </div>
        {jumpDown ? (
          <div className="pointer-events-none absolute bottom-28 left-1/2 z-10 -translate-x-1/2">
            <button
              type="button"
              className="pointer-events-auto rounded-full border border-border bg-card px-3 py-2 text-xs shadow-lg"
              onClick={() => {
                stickToBottom.current = true;
                threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
                setJumpDown(false);
              }}
            >
              Pastga
            </button>
          </div>
        ) : null}
        {connectionInterrupted ? (
          <div className="border-t border-amber-500/20 bg-amber-500/10 px-4 py-3 text-center text-sm">
            <p>Aloqa uzildi. Suhbat saqlanadi.</p>
            <div className="mt-2">
              <RetryButton onClick={() => void retryLast()} />
            </div>
          </div>
        ) : null}
        <ChatInput
          value={draft}
          onChange={setDraft}
          generating={generating}
          mode={active?.mode ?? "chat"}
          attachments={attachments}
          onAttachments={setAttachments}
          inputRef={inputRef}
          uploadProgress={uploadProgress}
          onCancelUpload={() => uploadAbort.current?.abort()}
          onStop={stopGeneration}
          onSend={() => {
            const text = draft;
            const files = attachments;
            setDraft("");
            setAttachments([]);
            void (async () => {
              let payload = text;
              const { images, documents, unsupported } = partitionAttachments(files);
              if (unsupported.length) {
                toast("Bu fayl turi qo'llab-quvvatlanmaydi.", "error");
              }
              const extractable = documents.filter((item) => item.file);
              if (extractable.length) {
                const form = new FormData();
                extractable.forEach((item) => form.append("files", item.file!));
                const controller = new AbortController();
                uploadAbort.current = controller;
                setUploadProgress(0);
                try {
                  const result = await uploadFormData<{
                    files?: { name: string; text?: string; error?: string; class?: string }[];
                    error?: string;
                  }>("/api/files/extract", form, {
                    signal: controller.signal,
                    onProgress: setUploadProgress,
                  });
                  if (!result.ok) {
                    toast(result.json.error ?? "Hujjatni o'qib bo'lmadi. Qayta urinib ko'ring.", "error");
                    setAttachments(files);
                    setDraft(text);
                    return;
                  }
                  const failed = (result.json.files ?? []).filter((item) => !item.text);
                  if (failed.length && failed.length === (result.json.files ?? []).length) {
                    toast(failed[0]?.error ?? "Hujjatni o'qib bo'lmadi. Qayta urinib ko'ring.", "error");
                    setAttachments(files);
                    setDraft(text);
                    return;
                  }
                  const bits = (result.json.files ?? [])
                    .filter((item) => item.text)
                    .map((item) => `[Hujjat: ${item.name}]\n${item.text}`);
                  if (bits.length) payload = `${payload}\n\n${bits.join("\n\n")}`.trim();
                } catch (error) {
                  if (!(error instanceof DOMException && error.name === "AbortError")) {
                    toast("Faylni yuborishda xatolik yuz berdi. Qayta urinib ko'ring.", "error");
                    setAttachments(files);
                    setDraft(text);
                  }
                  return;
                } finally {
                  setUploadProgress(null);
                  uploadAbort.current = null;
                }
              }
              const ok = await sendMessage(payload, [...images, ...extractable]);
              if (!ok) {
                toast("Aloqa uzildi. Qayta urinib ko'ring.", "error");
              }
            })();
          }}
        />
      </div>

      <LimitModal />
      <UpgradeModal />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ConfirmDialog
        open={Boolean(shareContent)}
        title="Javobni ulashish"
        description="Bu javobni boshqalar ko'rishi mumkin."
        confirmLabel="Ulashish"
        cancelLabel="Bekor qilish"
        tone="primary"
        onClose={() => setShareContent(null)}
        onConfirm={() => {
          const content = shareContent;
          setShareContent(null);
          if (!content) return;
          void fetch("/api/share", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, confirm: true, title: active?.title }),
          })
            .then(async (response) => {
              const json = (await response.json()) as { url?: string; error?: string; ephemeral?: boolean };
              if (!response.ok || !json.url) throw new Error(json.error);
              if (json.ephemeral) {
                await navigator.clipboard.writeText(content);
                toast("Matn nusxalandi. Ommaviy havola uchun Supabase kerak.", "success");
                return;
              }
              const absolute = `${window.location.origin}${json.url}`;
              await navigator.clipboard.writeText(absolute);
              toast("Ulashish havolasi nusxalandi", "success");
            })
            .catch(() => toast("Ulashishda xatolik yuz berdi.", "error"));
        }}
      />

      <Modal
        open={Boolean(renameId)}
        title="Suhbat nomini o'zgartirish"
        onClose={() => setRenameId(null)}
        className="max-w-md"
      >
        <Input
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
          placeholder="Yangi nom"
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRenameId(null)}>
            Bekor qilish
          </Button>
          <Button
            onClick={() => {
              if (renameId) {
                void renameConversation(renameId, renameValue).then(() => {
                  toast("Sozlamalar saqlandi", "success");
                });
              }
              setRenameId(null);
            }}
          >
            Saqlash
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Suhbatni o'chirish"
        description="Bu suhbatni o'chirmoqchimisiz?"
        confirmLabel="O'chirish"
        cancelLabel="Bekor qilish"
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            void deleteConversation(deleteId);
            toast("Suhbat o'chirildi", "success");
          }
          setDeleteId(null);
        }}
      />
    </div>
  );
}
