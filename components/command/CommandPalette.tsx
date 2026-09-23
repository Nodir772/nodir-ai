"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AI_TOOLS } from "@/lib/ai/tools";
import { useAuth } from "@/components/auth/AuthProvider";

type Group = "Chats" | "Tools" | "Settings" | "Actions";

type Item = {
  id: string;
  group: Group;
  label: string;
  hint?: string;
  run: () => void;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chats, setChats] = useState<{ id: string; title: string }[]>([]);
  const router = useRouter();
  const { setTheme } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) {
        if (event.key === "Escape") setOpen(false);
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "k" && !event.shiftKey) {
        event.preventDefault();
        setOpen((value) => !value);
        setQuery("");
        return;
      }
      if (event.shiftKey && key === "o") {
        event.preventDefault();
        window.dispatchEvent(new Event("nodir-new-chat"));
        router.push("/chat");
        return;
      }
      if (key === "/") {
        event.preventDefault();
        setOpen(false);
        window.dispatchEvent(new Event("nodir-focus-input"));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      const q = query.trim();
      if (!q) {
        setChats([]);
        return;
      }
      void fetch(`/api/conversations/search?q=${encodeURIComponent(q)}`)
        .then((response) => response.json())
        .then((json: { conversations?: { id: string; title: string }[] }) => {
          setChats(json.conversations ?? []);
        })
        .catch(() => setChats([]));
    }, 280);
    return () => window.clearTimeout(timer);
  }, [open, query]);

  const items = useMemo<Item[]>(() => {
    const actions: Item[] = [
    {
      id: "home",
      group: "Actions",
      label: "Boshqaruv paneli",
      run: () => router.push("/home"),
    },
    {
      id: "new",
        group: "Actions",
        label: "Yangi suhbat",
        hint: "Ctrl/Cmd+Shift+O",
        run: () => {
          window.dispatchEvent(new Event("nodir-new-chat"));
          router.push("/chat");
        },
      },
      {
        id: "studio",
        group: "Actions",
        label: "AI Studio",
        run: () => router.push("/studio"),
      },
      {
        id: "projects",
        group: "Actions",
        label: "Loyihalar",
        run: () => router.push("/projects"),
      },
      {
        id: "agents",
        group: "Actions",
        label: "Agentlar",
        run: () => router.push("/agents"),
      },
      {
        id: "tasks",
        group: "Actions",
        label: "Vazifalar",
        run: () => router.push("/tasks"),
      },
      {
        id: "automations",
        group: "Actions",
        label: "Avtomatlashtirish",
        run: () => router.push("/automations"),
      },
      {
        id: "theme-dark",
        group: "Actions",
        label: "Qorong'u mavzu",
        run: () => setTheme("dark"),
      },
      {
        id: "theme-light",
        group: "Actions",
        label: "Yorug' mavzu",
        run: () => setTheme("light"),
      },
      {
        id: "theme-system",
        group: "Actions",
        label: "Tizim mavzusi",
        run: () => setTheme("system"),
      },
      {
        id: "voice",
        group: "Tools",
        label: "Ovozli rejim",
        run: () => router.push("/voice"),
      },
      ...AI_TOOLS.map((tool) => ({
        id: `tool-${tool.id}`,
        group: "Tools" as const,
        label: tool.label,
        hint: tool.href,
        run: () => router.push(tool.href),
      })),
      {
        id: "settings",
        group: "Settings",
        label: "Sozlamalar",
        run: () => router.push("/settings"),
      },
      {
        id: "memory",
        group: "Settings",
        label: "Xotira",
        run: () => router.push("/settings/memory"),
      },
      {
        id: "usage",
        group: "Settings",
        label: "Foydalanish",
        run: () => router.push("/settings/usage"),
      },
      {
        id: "billing",
        group: "Settings",
        label: "To'lov",
        run: () => router.push("/settings/billing"),
      },
      {
        id: "pricing",
        group: "Settings",
        label: "Tariflar",
        run: () => router.push("/pricing"),
      },
      {
        id: "favorites",
        group: "Settings",
        label: "Sevimlilar",
        run: () => router.push("/favorites"),
      },
      ...(isAdmin
        ? [
            {
              id: "admin",
              group: "Settings" as const,
              label: "Admin",
              run: () => router.push("/admin"),
            },
          ]
        : []),
      ...chats.map((chat) => ({
        id: `chat-${chat.id}`,
        group: "Chats" as const,
        label: chat.title,
        run: () => router.push(`/chat/${chat.id}`),
      })),
    ];
    const needle = query.trim().toLowerCase();
    if (!needle) return actions;
    return actions.filter(
      (item) =>
        item.group === "Chats" ||
        item.label.toLowerCase().includes(needle) ||
        (item.hint?.toLowerCase().includes(needle) ?? false),
    );
  }, [chats, isAdmin, query, router, setTheme]);

  const groups = ["Chats", "Tools", "Settings", "Actions"] as const;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-start justify-center p-4 pt-[12vh]">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Yopish" onClick={() => setOpen(false)} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buyruqlar"
        className="relative w-full max-w-lg overflow-hidden rounded-[1.4rem] border border-border bg-card shadow-2xl"
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Chatlardan qidirish yoki buyruq..."
          className="h-12 w-full border-b border-border bg-transparent px-4 outline-none"
        />
        <div className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">Hech narsa topilmadi.</p>
          ) : (
            groups.map((group) => {
              const list = items.filter((item) => item.group === group);
              if (!list.length) return null;
              return (
                <div key={group} className="mb-2">
                  <p className="px-2 py-1 text-[11px] uppercase tracking-wider text-muted">{group}</p>
                  {list.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-2"
                      onClick={() => {
                        item.run();
                        setOpen(false);
                      }}
                    >
                      <span>{item.label}</span>
                      {item.hint ? <span className="text-[11px] text-muted">{item.hint}</span> : null}
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
        <p className="border-t border-border px-4 py-2 text-[11px] text-muted">
          Ctrl/Cmd+K qidiruv · Ctrl/Cmd+/ yozish maydoni · Esc yopish
        </p>
      </div>
    </div>
  );
}
