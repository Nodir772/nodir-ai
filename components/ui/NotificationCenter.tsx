"use client";

import { Bell, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CATEGORY_LABELS, type AppNotification } from "@/lib/notifications/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const LOCAL_KEY = "nodir-ai:notifications";

function readLocal(): AppNotification[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);

  const load = useCallback(() => {
    void fetch("/api/notifications")
      .then(async (response) => {
        if (!response.ok) {
          setItems(readLocal());
          return;
        }
        const json = (await response.json()) as { notifications?: AppNotification[] };
        setItems(json.notifications ?? []);
      })
      .catch(() => setItems(readLocal()));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unread = items.filter((item) => !item.readAt).length;

  async function markRead(id?: string) {
    if (id) {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)),
      );
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => undefined);
      return;
    }
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => undefined);
  }

  async function remove(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" }).catch(() => undefined);
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="relative grid h-11 w-11 place-items-center rounded-xl hover:bg-surface-2"
        aria-label="Bildirishnomalar"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void load();
        }}
      >
        <Bell size={18} />
        {unread > 0 ? (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" aria-hidden />
        ) : null}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Bildirishnomalar"
          className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-medium">Bildirishnomalar</p>
            {unread > 0 ? (
              <button type="button" className="text-xs text-accent" onClick={() => void markRead()}>
                Hammasini o&apos;qilgan
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <EmptyState title="Hozircha bildirishnoma yo'q" description="Muhim hisob va limit xabarlari shu yerda chiqadi." />
            ) : (
              <ul>
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={cn("border-b border-border px-3 py-3 last:border-0", !item.readAt && "bg-surface-2/50")}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => void markRead(item.id)}
                      >
                        <p className="text-[11px] uppercase tracking-wider text-muted">
                          {CATEGORY_LABELS[item.category]}
                        </p>
                        <p className="mt-0.5 text-sm font-medium">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted">{item.body}</p>
                      </button>
                      <button
                        type="button"
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
                        aria-label="O'chirish"
                        onClick={() => void remove(item.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
