"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useChat } from "@/components/chat/ChatProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/toast-context";
import { AI_MODELS } from "@/lib/ai/models";
import { PERSONAS } from "@/lib/ai/personas";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlanBadge } from "@/components/billing/PlanBadge";

const TABS = ["Profil", "Ko'rinish", "AI", "Bildirishnomalar", "Maxfiylik"] as const;
const STYLES = [
  { id: "qisqa", label: "Qisqa" },
  { id: "muvozanatli", label: "Muvozanatli" },
  { id: "batafsil", label: "Batafsil" },
] as const;

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Ko'rinish");
  const { theme } = useTheme();
  const { settings, updateSettings, persistTheme, deleteAllConversations, deleteConversation, active } = useChat();
  const { user, updateName } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [syncedOpen, setSyncedOpen] = useState(false);
  const [danger, setDanger] = useState<null | "current" | "all" | "account">(null);

  async function downloadExport(format: "json" | "md" | "txt") {
    const response = await fetch(`/api/account/export?format=${format}`);
    if (!response.ok) {
      toast("Eksport yuklanmadi.", "error");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nodir-ai-export.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (open && !syncedOpen) {
    setSyncedOpen(true);
    setName(user?.name ?? "");
  } else if (!open && syncedOpen) {
    setSyncedOpen(false);
  }

  return (
    <Modal open={open} title="Sozlamalar" onClose={onClose} className="max-w-2xl">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex gap-1 overflow-x-auto sm:w-40 sm:flex-col">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "rounded-xl px-3 py-2 text-left text-sm",
                tab === item ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2/70",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="min-h-48 flex-1 text-sm">
          {tab === "Profil" ? (
            <div className="space-y-3">
              <p className="text-muted">
                Ism hisobingizda saqlanadi. Avatar hozircha loyiha portretidan olinadi — shaxsiy
                hujjat yuklash shart emas.
              </p>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ism" />
              <p className="flex items-center gap-2 text-xs text-muted">
                Reja: <PlanBadge plan={user?.plan ?? "free"} />
              </p>
              <Button
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  const error = await updateName(name);
                  setSaving(false);
                  toast(error ?? "Sozlamalar saqlandi", error ? "error" : "success");
                }}
              >
                {saving ? "Saqlanmoqda..." : "Ismni saqlash"}
              </Button>
            </div>
          ) : null}
          {tab === "Ko'rinish" ? (
            <div className="grid gap-2">
              {(["dark", "light", "system"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    void persistTheme(item).then(() => toast("Sozlamalar saqlandi", "success"));
                  }}
                  className={cn(
                    "rounded-2xl border border-border px-4 py-3 text-left capitalize",
                    theme === item && "border-accent/50 bg-surface-2",
                  )}
                >
                  {item === "dark" ? "Qorong'u" : item === "light" ? "Yorug'" : "Tizim"}
                </button>
              ))}
            </div>
          ) : null}
          {tab === "AI" ? (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-muted">Standart model</p>
                <select
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3"
                  value={settings.defaultModel}
                  onChange={(event) => {
                    void updateSettings({ defaultModel: event.target.value as typeof settings.defaultModel }).then(() =>
                      toast("Sozlamalar saqlandi", "success"),
                    );
                  }}
                >
                  {AI_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.productName} — {model.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-2 text-muted">Javob uslubi</p>
                <div className="grid gap-2">
                  {STYLES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        void updateSettings({ responseStyle: item.id }).then(() =>
                          toast("Sozlamalar saqlandi", "success"),
                        );
                      }}
                      className={cn(
                        "rounded-2xl border border-border px-4 py-3 text-left",
                        settings.responseStyle === item.id && "border-accent/50 bg-surface-2",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-muted">AI rejimi</p>
                <select
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3"
                  value={settings.personaId}
                  onChange={(event) => {
                    void updateSettings({ personaId: event.target.value }).then(() => toast("Sozlamalar saqlandi", "success"));
                  }}
                >
                  {PERSONAS.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.label}
                    </option>
                  ))}
                </select>
              </div>
              <Link href="/settings/memory" className="inline-block text-sm text-accent">
                Xotira sozlamalari
              </Link>
            </div>
          ) : null}
          {tab === "Bildirishnomalar" ? (
            <div className="space-y-3">
              <p className="text-xs text-muted">Email yuborilmaydi — xizmat hali sozlanmagan.</p>
              <label className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                Email bildirishnomalar
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(event) => void updateSettings({ emailNotifications: event.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                Mahsulot yangilanishlari
                <input
                  type="checkbox"
                  checked={settings.productUpdates}
                  onChange={(event) => void updateSettings({ productUpdates: event.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                Limit ogohlantirishlari
                <input
                  type="checkbox"
                  checked={settings.usageAlerts}
                  onChange={(event) => void updateSettings({ usageAlerts: event.target.checked })}
                />
              </label>
            </div>
          ) : null}
          {tab === "Maxfiylik" ? (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-muted">
                Suhbatlar hisobingizga bog&apos;liq. Monitoring faqat kechikish va xato kodlarini yozadi — xabar matni,
                parol va API kalitlari logga tushmaydi. Eksport faqat sizning ma&apos;lumotlaringizni yuklaydi.
              </p>
              <Button
                variant="outline"
                onClick={() => void downloadExport("json")}
              >
                Ma&apos;lumotlarni JSON qilish
              </Button>
              <Button
                variant="outline"
                onClick={() => void downloadExport("md")}
              >
                Markdown eksport
              </Button>
              <Button
                variant="outline"
                onClick={() => void downloadExport("txt")}
              >
                TXT eksport
              </Button>
              <Button variant="outline" onClick={() => setDanger("current")}>
                Joriy suhbatni o&apos;chirish
              </Button>
              <Button variant="outline" onClick={() => setDanger("all")}>
                Barcha suhbatlarni o&apos;chirish
              </Button>
              <Link href="/settings/memory" className="block">
                <Button variant="outline" className="w-full">
                  Xotiralarni boshqarish
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setDanger("account")}>
                Hisobni o&apos;chirish
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      <ConfirmDialog
        open={danger !== null}
        title="Tasdiqlash"
        description={
          danger === "account"
            ? "Hisob, suhbatlar va xotiralar o'chiriladi. Bu amalni bekor qilib bo'lmaydi."
            : "Bu amalni bekor qilib bo'lmaydi."
        }
        confirmLabel="O'chirish"
        onClose={() => setDanger(null)}
        onConfirm={() => {
          const kind = danger;
          setDanger(null);
          if (kind === "current" && active) {
            void deleteConversation(active.id);
            toast("Suhbat o'chirildi", "success");
          }
          if (kind === "all") {
            void deleteAllConversations();
            toast("Suhbat o'chirildi", "success");
          }
          if (kind === "account") {
            void fetch("/api/account", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ confirm: true }),
            }).then(() => {
              toast("Ma'lumotlar o'chirildi", "success");
              router.push("/login");
              router.refresh();
            });
          }
        }}
      />
    </Modal>
  );
}
