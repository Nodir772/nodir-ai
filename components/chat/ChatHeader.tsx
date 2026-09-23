"use client";

import { ChevronDown, Menu, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { PersonaSelector } from "@/components/chat/PersonaSelector";
import { ShareExportMenu } from "@/components/chat/ShareExportMenu";
import { useChat } from "@/components/chat/ChatProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Logo } from "@/components/brand/Logo";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { useAuth } from "@/components/auth/AuthProvider";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import { getModelById } from "@/lib/ai/models";
import { AUTO_MODEL_ID } from "@/lib/ai/auto-model";

export function ChatHeader({
  onMenu,
  onSettings,
}: {
  onMenu: () => void;
  onSettings: () => void;
}) {
  const { active, conversations, selectConversation, modelId, modelSelection } = useChat();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function close() {
      setOpen(false);
    }
    if (open) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border px-3 sm:h-16 sm:px-5">
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2 lg:hidden"
        aria-label="Menyuni ochish"
        onClick={onMenu}
      >
        <Menu size={18} />
      </button>
      <div className="lg:hidden">
        <Logo size="sm" showWordmark={false} />
      </div>
      <div className="relative min-w-0 flex-1" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="inline-flex max-w-full items-center gap-1 truncate rounded-xl px-2 py-1 text-sm font-medium hover:bg-surface-2"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <span className="truncate">{active?.title ?? "Yangi suhbat"}</span>
          <ChevronDown size={16} className="shrink-0 text-muted" />
        </button>
        {open ? (
          <ul className="absolute left-0 z-20 mt-2 max-h-72 w-72 overflow-auto rounded-2xl border border-border bg-card p-1 shadow-2xl">
            {conversations.slice(0, 12).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full truncate rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-2"
                  onClick={() => {
                    void selectConversation(item.id);
                    setOpen(false);
                  }}
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <PersonaSelector />
      <PlanBadge plan={user?.plan ?? "free"} className="hidden sm:inline-flex" />
      {modelSelection === AUTO_MODEL_ID ? (
        <span className="hidden rounded-full border border-border px-2.5 py-1 text-[11px] text-muted sm:inline">
          Auto · {getModelById(modelId).name}
        </span>
      ) : null}
      <ShareExportMenu />
      <NotificationCenter />
      <ThemeToggle />
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2"
        aria-label="Sozlamalar"
        onClick={onSettings}
      >
        <Settings size={18} />
      </button>
    </header>
  );
}
