"use client";

import { Globe, Mic, MoreHorizontal, Paperclip } from "lucide-react";
import { useChat } from "@/components/chat/ChatProvider";
import { CHAT_MODES } from "@/lib/chat/modes";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ComposerExtras({
  onAttach,
  onVoice,
  listening,
}: {
  onAttach: () => void;
  onVoice: () => void;
  listening: boolean;
}) {
  const { settings, updateSettings, setMode, active } = useChat();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="mb-1 hidden h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground sm:grid"
        aria-label="Fayl biriktirish"
        onClick={onAttach}
      >
        <Paperclip size={18} />
      </button>
      <button
        type="button"
        className={cn(
          "mb-1 hidden h-10 items-center gap-1 rounded-full px-2 text-xs sm:inline-flex",
          settings.webSearch ? "bg-accent/15 text-accent" : "text-muted hover:bg-surface-2 hover:text-foreground",
        )}
        aria-pressed={settings.webSearch}
        onClick={() => void updateSettings({ webSearch: !settings.webSearch })}
      >
        <Globe size={16} />
        <span className="hidden md:inline">Internetdan qidirish</span>
      </button>
      <button
        type="button"
        aria-pressed={listening}
        className="mb-1 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground sm:hidden"
        aria-label="Qo'shimcha"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={18} />
      </button>
      {open ? (
        <div className="absolute bottom-full left-2 z-20 mb-2 w-56 rounded-2xl border border-border bg-card p-1 shadow-2xl sm:hidden">
          <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm" onClick={() => { onAttach(); setOpen(false); }}>
            <Paperclip size={16} /> Fayl
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm"
            onClick={() => {
              void updateSettings({ webSearch: !settings.webSearch });
              setOpen(false);
            }}
          >
            <Globe size={16} /> Internetdan qidirish
          </button>
          <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm" onClick={() => { onVoice(); setOpen(false); }}>
            <Mic size={16} className={listening ? "text-accent" : undefined} /> Ovoz
          </button>
          {CHAT_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={cn("flex w-full rounded-xl px-3 py-2 text-left text-sm", active?.mode === mode.id && "bg-surface-2")}
              onClick={() => {
                if (mode.id === "image") router.push("/tools/image");
                else if (mode.id === "docs") router.push("/tools/documents");
                else if (mode.id === "translate") router.push("/tools/translate");
                else if (mode.id === "write") router.push("/tools/writer");
                else if (mode.id === "code") router.push("/tools/code");
                else setMode(mode.id);
                setOpen(false);
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
