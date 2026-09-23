"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { useChat } from "@/components/chat/ChatProvider";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/toast-context";
import {
  conversationToJson,
  conversationToMarkdown,
  conversationToText,
  downloadText,
  printConversationPdf,
} from "@/lib/export/conversation";

export function ShareExportMenu() {
  const { active } = useChat();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const messages = (active?.messages ?? []).map((message) => ({
    role: message.role,
    content: message.content,
  }));
  const title = active?.title ?? "Nodir AI suhbat";
  const date = new Date(active?.updatedAt ?? active?.createdAt ?? "2020-01-01T00:00:00.000Z").toLocaleString("uz-UZ");

  return (
    <>
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2"
        aria-label="Ulashish / eksport"
        onClick={() => setOpen(true)}
      >
        <Share2 size={18} />
      </button>
      <Modal open={open} title="Ulashish / eksport" onClose={() => setOpen(false)} className="max-w-md">
        <div className="grid gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(conversationToMarkdown(title, date, messages));
              toast("Nusxa olindi", "success");
              setOpen(false);
            }}
          >
            Nusxa olish
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              downloadText(`${title}.txt`, conversationToText(title, date, messages), "text/plain");
              setOpen(false);
            }}
          >
            TXT
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              downloadText(`${title}.md`, conversationToMarkdown(title, date, messages), "text/markdown");
              setOpen(false);
            }}
          >
            Markdown
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              downloadText(`${title}.json`, conversationToJson(title, date, messages), "application/json");
              setOpen(false);
            }}
          >
            JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const ok = printConversationPdf(title, date, messages);
              toast(ok ? "Chop etish oynasi ochildi" : "Popup bloklandi", ok ? "success" : "error");
              setOpen(false);
            }}
          >
            PDF
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              setShareOpen(true);
            }}
          >
            Ommaviy ulashish
          </Button>
        </div>
      </Modal>
      <ConfirmDialog
        open={shareOpen}
        title="Suhbatni ulashish"
        description="Bu javobni boshqalar ko'rishi mumkin. Email, ichki ID va tizim sozlamalari ulashilmaydi."
        confirmLabel="Ulashish"
        cancelLabel="Bekor qilish"
        tone="primary"
        onClose={() => setShareOpen(false)}
        onConfirm={() => {
          setShareOpen(false);
          if (!active) return;
          void fetch("/api/share", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              confirm: true,
              conversationId: active.id,
              title: active.title,
              messages: active.messages.map((message) => ({
                role: message.role,
                content: message.content,
                createdAt: message.createdAt,
              })),
            }),
          })
            .then(async (response) => {
              const json = (await response.json()) as { url?: string; ephemeral?: boolean; error?: string };
              if (!response.ok || !json.url) throw new Error(json.error);
              if (json.ephemeral) {
                await navigator.clipboard.writeText(conversationToMarkdown(title, date, messages));
                toast("Matn nusxalandi. Ommaviy havola uchun Supabase kerak.", "success");
                return;
              }
              await navigator.clipboard.writeText(`${window.location.origin}${json.url}`);
              toast("Ulashish havolasi nusxalandi", "success");
            })
            .catch(() => toast("Ulashishda xatolik yuz berdi.", "error"));
        }}
      />
    </>
  );
}
