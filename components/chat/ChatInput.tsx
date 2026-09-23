"use client";

import { ArrowUp, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AttachmentPreview } from "@/components/chat/AttachmentPreview";
import { ComposerExtras } from "@/components/chat/ComposerExtras";
import { ModeSelector } from "@/components/chat/ModeSelector";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { useChat } from "@/components/chat/ChatProvider";
import { useToast } from "@/components/ui/toast-context";
import { getAiMode } from "@/lib/ai/modes";
import { getMode } from "@/lib/chat/modes";
import { FILE_ERRORS, FILE_LIMITS, formatBytes } from "@/lib/files/validate";
import { classifyAttachment } from "@/lib/files/classify";
import { cn } from "@/lib/utils";
import type { AttachmentFile, ChatMode } from "@/types/chat";

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  disabled,
  generating,
  mode,
  attachments,
  onAttachments,
  inputRef,
  uploadProgress,
  onCancelUpload,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  disabled?: boolean;
  generating: boolean;
  mode: ChatMode;
  attachments: AttachmentFile[];
  onAttachments: (files: AttachmentFile[]) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  uploadProgress?: number | null;
  onCancelUpload?: () => void;
}) {
  const { toast } = useToast();
  const { settings, setAiMode, modelSelection, setModelSelection, modelId } = useChat();
  const fileRef = useRef<HTMLInputElement>(null);
  const localRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef ?? localRef;
  const placeholder = getAiMode(settings.aiMode).placeholder || getMode(mode)?.placeholder || "Xabar yozing...";
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value, textareaRef]);

  useEffect(() => {
    function focusInput() {
      textareaRef.current?.focus();
    }
    window.addEventListener("nodir-focus-input", focusInput);
    return () => window.removeEventListener("nodir-focus-input", focusInput);
  }, [textareaRef]);

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    if (attachments.length + list.length > FILE_LIMITS.maxFiles) {
      toast(FILE_ERRORS.tooMany, "error");
      return;
    }
    const next: AttachmentFile[] = [];
    for (const file of Array.from(list)) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const classified = classifyAttachment(bytes, file.name, file.type);
      if (!classified.ok) {
        toast(classified.error, "error");
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        name: file.name,
        type: classified.mime ?? file.type,
        size: file.size,
        kind: classified.class,
        previewUrl: classified.class === "IMAGE" ? URL.createObjectURL(file) : undefined,
        file,
      });
    }
    onAttachments([...attachments, ...next]);
  }

  function startVoice() {
    const Ctor = (window as Window & { SpeechRecognition?: new () => BrowserSpeech; webkitSpeechRecognition?: new () => BrowserSpeech }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: new () => BrowserSpeech }).webkitSpeechRecognition;
    if (!Ctor) {
      toast("Ovozli kiritish ushbu brauzerda qo'llab-quvvatlanmaydi.", "error");
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "uz-UZ";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) onChange(value ? `${value} ${transcript}` : transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  const canSend = !disabled && !generating && (value.trim().length > 0 || attachments.length > 0);

  return (
    <div className="border-t border-border bg-background/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:p-4">
      <div className="mx-auto max-w-3xl">
        <AttachmentPreview
          files={attachments}
          processing={typeof uploadProgress === "number"}
          onRemove={(id) => onAttachments(attachments.filter((file) => file.id !== id))}
        />
        {typeof uploadProgress === "number" ? (
          <div className="mb-2 flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 text-xs">
            <span className="flex-1">Yuklanmoqda... {uploadProgress}%</span>
            {onCancelUpload ? (
              <button type="button" className="text-accent" onClick={onCancelUpload}>
                Bekor qilish
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
          <ModelSelector value={modelSelection} onChange={setModelSelection} usedModelId={modelId} />
          <ModeSelector value={settings.aiMode} onChange={setAiMode} />
        </div>
        <div className="glass relative flex items-end gap-2 rounded-[1.6rem] p-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.docx,.txt,.csv,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            className="sr-only"
            onChange={(event) => {
              void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <ComposerExtras
            onAttach={() => fileRef.current?.click()}
            onVoice={startVoice}
            listening={listening}
          />
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSend) onSend();
              }
            }}
            className="max-h-44 min-h-11 flex-1 resize-none bg-transparent px-1 py-2.5 text-[15px] outline-none placeholder:text-muted disabled:opacity-60"
          />
          <button
            type="button"
            className={cn(
              "mb-1 grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2",
              listening ? "text-accent" : "text-muted hover:text-foreground",
            )}
            aria-label="Ovozli kiritish"
            aria-pressed={listening}
            onClick={startVoice}
          >
            <Mic size={18} />
          </button>
          {generating ? (
            <button
              type="button"
              onClick={onStop}
              className="mb-1 grid h-10 w-10 place-items-center rounded-full bg-red-500 text-white"
              aria-label="To'xtatish"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              className={cn(
                "mb-1 grid h-10 w-10 place-items-center rounded-full text-white",
                "bg-[linear-gradient(135deg,#4f7cff_0%,#8b5cf6_100%)] disabled:opacity-40",
              )}
              aria-label="Yuborish"
            >
              <ArrowUp size={18} />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">
          Enter — yuborish · Shift + Enter — yangi qator
          {attachments.length
            ? ` · ${attachments.map((file) => `${file.name} (${file.kind === "IMAGE" ? "rasm" : "hujjat"}, ${formatBytes(file.size)})`).join(", ")}`
            : ""}
          {attachments.some((file) => file.kind === "IMAGE") ? " · Rasm tahlili" : ""}
        </p>
      </div>
    </div>
  );
}

type BrowserSpeech = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

