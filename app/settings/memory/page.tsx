"use client";

import { useEffect, useState } from "react";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { MEMORY_CATEGORIES, type Memory, type MemoryCategory } from "@/lib/memory/types";

const LABELS: Record<MemoryCategory, string> = {
  preference: "Afzallik",
  project: "Loyiha",
  learning: "O'rganish",
  general: "Umumiy",
};

export default function MemorySettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<MemoryCategory>("general");
  const [error, setError] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  async function load() {
    const response = await fetch("/api/memories");
    const json = (await response.json()) as { memories?: Memory[]; error?: string };
    if (response.ok) setMemories(json.memories ?? []);
  }

  useEffect(() => {
    void fetch("/api/settings")
      .then((response) => response.json())
      .then((json: { settings?: { memoryEnabled?: boolean } }) => {
        if (typeof json.settings?.memoryEnabled === "boolean") setEnabled(json.settings.memoryEnabled);
      })
      .catch(() => undefined);
    void fetch("/api/memories")
      .then((response) => response.json())
      .then((json: { memories?: Memory[] }) => {
        if (json.memories) setMemories(json.memories);
      })
      .catch(() => undefined);
  }, []);

  async function persistEnabled(next: boolean) {
    setEnabled(next);
    const stored = localStorage.getItem("nodir-ai:chat-settings");
    try {
      const parsed = stored ? (JSON.parse(stored) as Record<string, unknown>) : {};
      localStorage.setItem("nodir-ai:chat-settings", JSON.stringify({ ...parsed, memoryEnabled: next }));
    } catch {
      /* ignore */
    }
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memoryEnabled: next }),
    });
  }

  return (
    <SettingsShell title="Nodir AI xotirasi">
      <p className="text-sm text-muted">
        Nodir AI siz haqingizdagi foydali ma&apos;lumotlarni eslab qolishi mumkin.
      </p>
      <label className="mt-5 flex items-center justify-between rounded-2xl border border-border px-4 py-3">
        Xotira
        <input type="checkbox" checked={enabled} onChange={(event) => void persistEnabled(event.target.checked)} />
      </label>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Foydalanuvchi Flutter o'rganmoqda."
        />
        <select
          className="h-11 rounded-2xl border border-border bg-background px-3"
          value={category}
          onChange={(event) => setCategory(event.target.value as MemoryCategory)}
        >
          {MEMORY_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {LABELS[item]}
            </option>
          ))}
        </select>
      </div>
      <Button
        className="mt-3"
        onClick={async () => {
          setError(null);
          const response = await fetch("/api/memories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, category }),
          });
          const json = (await response.json()) as { error?: string };
          if (!response.ok) {
            setError(json.error ?? "Saqlab bo'lmadi.");
            return;
          }
          setContent("");
          await load();
        }}
      >
        Qo&apos;shish
      </Button>
      {error ? <p className="mt-2 text-sm text-amber-200">{error}</p> : null}
      <ul className="mt-6 space-y-2">
        {memories.length === 0 ? <li className="text-sm text-muted">Hozircha xotira yo&apos;q.</li> : null}
        {memories.map((memory) => (
          <li key={memory.id} className="flex items-start justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3">
            <span>
              <span className="block text-sm">{memory.content}</span>
              <span className="text-xs text-muted">{LABELS[memory.category]}</span>
            </span>
            <button
              type="button"
              className="text-sm text-muted hover:text-foreground"
              onClick={async () => {
                await fetch(`/api/memories/${memory.id}`, { method: "DELETE" });
                await load();
              }}
            >
              O&apos;chirish
            </button>
          </li>
        ))}
      </ul>
      {memories.length ? (
        <Button variant="outline" className="mt-4" onClick={() => setClearOpen(true)}>
          Barchasini o&apos;chirish
        </Button>
      ) : null}
      <ConfirmDialog
        open={clearOpen}
        title="Barcha xotiralarni o'chirish"
        description="Bu amalni bekor qilib bo'lmaydi."
        confirmLabel="O'chirish"
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          setClearOpen(false);
          void fetch("/api/memories", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confirm: true }),
          }).then(() => load());
        }}
      />
    </SettingsShell>
  );
}
