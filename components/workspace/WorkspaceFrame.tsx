"use client";

import { type ReactNode, useState } from "react";
import { Menu, Settings } from "lucide-react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { SettingsModal } from "@/components/chat/SettingsModal";
import { useChat } from "@/components/chat/ChatProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/toast-context";
import { LimitModal } from "@/components/workspace/LimitModal";
import { UpgradeModal } from "@/components/billing/UpgradeModal";

export function WorkspaceFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { conversations, renameConversation, deleteConversation } = useChat();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
        />
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Yon panelni yopish" onClick={() => setSidebarOpen(false)} />
          <div className="relative h-full w-[min(100%,270px)] bg-secondary shadow-2xl">
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
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b border-border px-3 sm:h-16 sm:px-5">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2 lg:hidden"
            aria-label="Menyuni ochish"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="lg:hidden">
            <Logo size="sm" showWordmark={false} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{title}</p>
            {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
          </div>
          <ThemeToggle />
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2"
            aria-label="Sozlamalar"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <LimitModal />
      <UpgradeModal />
      <Modal open={Boolean(renameId)} title="Suhbat nomini o'zgartirish" onClose={() => setRenameId(null)} className="max-w-md">
        <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} placeholder="Yangi nom" />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRenameId(null)}>Bekor qilish</Button>
          <Button
            onClick={() => {
              if (renameId) void renameConversation(renameId, renameValue).then(() => toast("Sozlamalar saqlandi", "success"));
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
