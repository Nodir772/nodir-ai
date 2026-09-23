"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/loaders";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { useToast } from "@/components/ui/toast-context";
import { createSseDecoder, parseStreamEvent } from "@/lib/ai/streaming";
import type { Memory } from "@/lib/memory/types";

type Agent = {
  id: string;
  name: string;
  description: string;
  source: "builtin" | "custom";
  instructions?: string;
  allowedTools: string[];
  locked?: boolean;
  favorite?: boolean;
  minPlan?: string;
};

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export function AgentDetail({ agentId }: { agentId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryDraft, setMemoryDraft] = useState("");
  const [taskDraft, setTaskDraft] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(() => {
    void (async () => {
      try {
        const [agentRes, chatRes, memRes] = await Promise.all([
          fetch(`/api/agents/${agentId}`),
          fetch(`/api/agents/${agentId}/chat`),
          fetch(`/api/agents/${agentId}/memories`),
        ]);
        const agentJson = (await agentRes.json()) as { agent?: Agent; error?: string };
        if (!agentRes.ok || !agentJson.agent) throw new Error(agentJson.error ?? "Agent topilmadi.");
        setAgent(agentJson.agent);
        const chatJson = (await chatRes.json()) as { messages?: ChatMessage[] };
        setMessages(chatJson.messages ?? []);
        const memJson = (await memRes.json()) as { memories?: Memory[] };
        setMemories(memJson.memories ?? []);
        setError(null);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Yuklashda xatolik yuz berdi.");
      }
    })();
  }, [agentId]);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function send() {
    const content = draft.trim();
    if (!content || busy) return;
    setBusy(true);
    setDraft("");
    setMessages((current) => [...current, { id: "local-user", role: "user", content }]);
    let produced = "";
    try {
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, webSearch: agent?.allowedTools.includes("web_search") }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/event-stream")) {
        const json = (await response.json()) as { error?: string };
        throw new Error(json.error ?? "Javob kelmadi.");
      }
      if (!response.body) throw new Error("Javob kelmadi.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const sse = createSseDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        for (const piece of sse.push(decoder.decode(value, { stream: true }))) {
          const event = parseStreamEvent(piece);
          if (event?.type === "delta") {
            produced += event.text;
            setMessages((current) => {
              const without = current.filter((item) => item.id !== "local-assistant");
              return [...without, { id: "local-assistant", role: "assistant", content: produced }];
            });
          } else if (event?.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : "Xatolik", "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite() {
    if (!agent) return;
    const next = !agent.favorite;
    if (next) {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "agent", itemId: agent.id }),
      });
    } else {
      await fetch(`/api/favorites?itemType=agent&itemId=${agent.id}`, { method: "DELETE" });
    }
    setAgent({ ...agent, favorite: next });
  }

  async function addMemory() {
    const content = memoryDraft.trim();
    if (!content) return;
    const response = await fetch(`/api/agents/${agentId}/memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      toast(json.error ?? "Xotira saqlanmadi", "error");
      return;
    }
    setMemoryDraft("");
    load();
  }

  async function startTask() {
    const prompt = taskDraft.trim();
    if (!prompt) return;
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, prompt, title: prompt.slice(0, 80) }),
    });
    const json = (await response.json()) as { task?: { id: string }; error?: string };
    if (!response.ok || !json.task) {
      toast(json.error ?? "Vazifa yaratilmadi", "error");
      return;
    }
    await fetch(`/api/tasks/${json.task.id}/run`, { method: "POST" });
    router.push(`/tasks/${json.task.id}`);
  }

  if (error && !agent) {
    return (
      <WorkspaceFrame title="Agent">
        <ErrorState error={error} onRetry={load} />
      </WorkspaceFrame>
    );
  }
  if (!agent) {
    return (
      <WorkspaceFrame title="Agent">
        <CardSkeleton />
      </WorkspaceFrame>
    );
  }

  return (
    <WorkspaceFrame title={agent.name} subtitle={agent.description}>
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_280px]">
        <section className="flex min-h-[60vh] flex-col rounded-[1.4rem] border border-border bg-card">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <EmptyState title="Suhbatni boshlang" description="Bu agentning o'z xotirasi alohida saqlanadi." />
            ) : (
              messages.map((message) => (
                <article key={message.id} className={message.role === "user" ? "ml-8 rounded-2xl bg-surface-2 p-3" : "mr-8"}>
                  <p className="text-[11px] uppercase text-muted">{message.role === "user" ? "Siz" : agent.name}</p>
                  {message.role === "assistant" ? <ChatMarkdown content={message.content} /> : <p className="text-sm">{message.content}</p>}
                </article>
              ))
            )}
          </div>
          <form
            className="flex gap-2 border-t border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <label className="min-w-0 flex-1">
              <span className="sr-only">Xabar</span>
              <input
                className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm outline-none"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={agent.locked ? "Tarifni yangilang" : "Xabar yozing"}
                disabled={agent.locked || busy}
              />
            </label>
            <Button disabled={agent.locked || busy}>{busy ? "..." : "Yuborish"}</Button>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => void toggleFavorite()}>
              <Star size={14} className={agent.favorite ? "fill-accent text-accent" : undefined} />
              Sevimli
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void fetch(`/api/agents/${agentId}/duplicate`, { method: "POST" }).then(async (response) => {
                  const json = (await response.json()) as { agent?: { id: string }; error?: string };
                  if (!response.ok || !json.agent) toast(json.error ?? "Nusxa olinmadi", "error");
                  else router.push(`/agents/${json.agent.id}`);
                });
              }}
            >
              Nusxa
            </Button>
            {agent.source === "custom" ? (
              <Link href={`/agents/create?edit=${agent.id}`}>
                <Button variant="outline" size="sm">
                  Tahrirlash
                </Button>
              </Link>
            ) : null}
          </div>
          {agent.locked ? <p className="text-sm text-muted">Bu agent uchun {agent.minPlan} tarifi kerak.</p> : null}
          <p className="text-xs text-muted">Vositalar: {agent.allowedTools.join(", ") || "yo'q"}</p>
          {agent.instructions ? (
            <details className="rounded-2xl border border-border p-3 text-sm">
              <summary>Yo&apos;riqnoma</summary>
              <p className="mt-2 whitespace-pre-wrap text-muted">{agent.instructions}</p>
            </details>
          ) : null}
          <div className="rounded-2xl border border-border p-3">
            <h2 className="text-sm font-medium">Vazifa</h2>
            <textarea
              className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-background p-2 text-sm"
              value={taskDraft}
              onChange={(event) => setTaskDraft(event.target.value)}
              placeholder="Ko'p qadamli vazifa..."
            />
            <Button className="mt-2 w-full" size="sm" onClick={() => void startTask()} disabled={agent.locked}>
              Ishga tushirish
            </Button>
          </div>
          <div className="rounded-2xl border border-border p-3">
            <h2 className="text-sm font-medium">Agent xotirasi</h2>
            <div className="mt-2 flex gap-2">
              <Input value={memoryDraft} onChange={(event) => setMemoryDraft(event.target.value)} placeholder="Faqat shu agent" />
              <Button size="sm" onClick={() => void addMemory()}>
                Qo&apos;shish
              </Button>
            </div>
            <ul className="mt-2 space-y-2 text-sm">
              {memories.map((memory) => (
                <li key={memory.id} className="flex items-start justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2">
                  <span>{memory.content}</span>
                  <button
                    type="button"
                    className="text-xs text-muted"
                    onClick={() => {
                      void fetch(`/api/agents/${agentId}/memories?memoryId=${memory.id}`, { method: "DELETE" }).then(load);
                    }}
                  >
                    O&apos;chirish
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {agent.source === "custom" ? (
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
              O&apos;chirish
            </Button>
          ) : null}
        </aside>
      </div>
      <ConfirmDialog
        open={deleteOpen}
        title="Agentni o'chirish"
        description="Maxsus agent o'chiriladi. Tayyor katalog saqlanadi."
        confirmLabel="O'chirish"
        cancelLabel="Bekor qilish"
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          void fetch(`/api/agents/${agentId}`, { method: "DELETE" }).then((response) => {
            if (response.ok) router.push("/agents");
            else toast("O'chirilmadi", "error");
          });
        }}
      />
    </WorkspaceFrame>
  );
}
