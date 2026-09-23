"use client";

import { memo, useState } from "react";
import { Copy, Globe, Pencil, RefreshCw, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { ConfigErrorNotice } from "@/components/chat/ConfigErrorNotice";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/toast-context";
import { AVATAR_SRC } from "@/lib/constants";
import { getModelById } from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

export const ChatMessageBubble = memo(function ChatMessageBubble({
  message,
  onRegenerate,
  onLike,
  onShare,
  onEdit,
  onRetry,
  generating = false,
  isStreaming = false,
  compact = false,
}: {
  message: ChatMessage;
  onRegenerate?: () => void;
  onLike?: (value: boolean | null) => void;
  onShare?: () => void;
  onEdit?: (content: string) => void;
  onRetry?: () => void;
  generating?: boolean;
  isStreaming?: boolean;
  compact?: boolean;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  if (message.role === "notice") {
    if (message.errorCode === "MISSING_API_KEY") {
      return <ConfigErrorNotice onRetry={onRetry} />;
    }
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-center text-sm leading-6 text-amber-100/90">
        {message.content}
        {onRetry ? (
          <div className="mt-2">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full border border-amber-400/30 px-3 py-1 text-xs hover:bg-amber-400/10"
            >
              Qayta urinish
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  const isUser = message.role === "user";

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content);
      toast("Nusxa olindi", "success");
    } catch {
      toast("Xatolik yuz berdi", "error");
    }
  }

  return (
    <article className={cn("group flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {isUser ? (
        <Avatar src={AVATAR_SRC} alt="Nodir" size={36} className="mt-1 shrink-0" />
      ) : (
        <Logo showWordmark={false} size="sm" className="mt-1 shrink-0" markClassName="h-9 w-9 rounded-xl text-xs" />
      )}
      <div className={cn("min-w-0 max-w-[min(100%,42rem)]", isUser ? "text-right" : "text-left")}>
        <div
          className={cn(
            "rounded-[1.35rem] px-4 py-3 text-[15px] leading-7",
            isUser
              ? "bg-[linear-gradient(135deg,#4f7cff_0%,#6d5efc_100%)] text-white"
              : "border border-border bg-card",
          )}
        >
          {isUser && editing ? (
            <div className="text-left">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="min-h-24 w-full rounded-xl bg-black/20 p-2 text-sm text-white outline-none"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="rounded-full bg-white/15 px-3 py-1 text-xs"
                  onClick={() => {
                    setEditing(false);
                    setDraft(message.content);
                  }}
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black"
                  onClick={() => {
                    const next = draft.trim();
                    if (!next || next === message.content) {
                      setEditing(false);
                      return;
                    }
                    setEditing(false);
                    onEdit?.(next);
                  }}
                >
                  Saqlash va qayta yaratish
                </button>
              </div>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap text-left">{message.content}</p>
          ) : (
            <ChatMarkdown content={message.content} streaming={isStreaming} />
          )}
          {message.attachments?.length ? (
            <ul className="mt-2 space-y-1 text-left text-xs opacity-80">
              {message.attachments.map((file) => (
                <li key={file.id} className="flex items-center gap-2">
                  {file.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.previewUrl} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : null}
                  <span>
                    {file.name}
                    {file.kind ? ` · ${file.kind === "IMAGE" ? "rasm" : "hujjat"}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {message.usedMemories?.length ? (
            <details className="mt-2 text-left text-xs text-muted">
              <summary className="cursor-pointer text-accent">Xotiradan foydalanildi</summary>
              <ul className="mt-1 space-y-1">
                {message.usedMemories.map((item) => (
                  <li key={item.id}>{item.content}</li>
                ))}
              </ul>
            </details>
          ) : null}
          {message.webSearchUsed || message.sources?.length || message.searchError ? (
            <p className="mt-2 inline-flex items-center gap-1 text-left text-xs text-muted">
              <Globe size={12} /> Internet qidiruvi
            </p>
          ) : null}
          {message.searchError ? (
            <p className="mt-1 text-left text-xs text-amber-200">{message.searchError}</p>
          ) : null}
          {message.sources?.length ? (
            <div className="mt-3 text-left">
              <p className="text-xs font-medium text-muted">Manbalar</p>
              <ul className="mt-1 space-y-1">
                {message.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-accent hover:underline"
                    >
                      {source.title}
                      <span className="ml-1 text-muted">
                        {source.domain ?? new URL(source.url).hostname}
                      </span>
                    </a>
                    {source.snippet ? <p className="text-[11px] text-muted">{source.snippet}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {message.usedModelId && !isUser ? (
            <p className="mt-2 text-left text-[11px] text-muted">
              Model: {getModelById(message.usedModelId).name}
            </p>
          ) : null}
        </div>
        {isUser && !editing && onEdit ? (
          <div className="mt-2 flex justify-end gap-1 opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100 md:focus-within:opacity-100">
            <ActionButton
              label="Tahrirlash"
              onClick={() => {
                setDraft(message.content);
                setEditing(true);
              }}
              disabled={generating}
            >
              <Pencil size={14} />
            </ActionButton>
            <ActionButton label="Nusxa olish" onClick={() => void copy()}>
              <Copy size={14} />
            </ActionButton>
          </div>
        ) : null}
        {!isUser && !isStreaming ? (
          <div
            className={cn(
              "mt-2 inline-flex items-center gap-0.5 rounded-full border border-border bg-card/80 p-0.5",
              compact ? "opacity-100" : "opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100 md:focus-within:opacity-100",
            )}
          >
            <ActionButton label="Nusxa olish" onClick={() => void copy()} disabled={generating}>
              <Copy size={14} />
            </ActionButton>
            <ActionButton label="Qayta yaratish" onClick={onRegenerate} disabled={generating}>
              <RefreshCw size={14} />
            </ActionButton>
            <ActionButton
              label="Yoqdi"
              onClick={() => onLike?.(message.liked === true ? null : true)}
              active={message.liked === true}
            >
              <ThumbsUp size={14} />
            </ActionButton>
            <ActionButton
              label="Yoqmadi"
              onClick={() => onLike?.(message.liked === false ? null : false)}
              active={message.liked === false}
            >
              <ThumbsDown size={14} />
            </ActionButton>
            <ActionButton label="Ulashish" onClick={() => onShare?.()}>
              <Share2 size={14} />
            </ActionButton>
          </div>
        ) : null}
      </div>
    </article>
  );
});

function ActionButton({
  children,
  label,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-40",
        active && "text-accent",
      )}
    >
      {children}
    </button>
  );
}
