"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Plus, Star } from "lucide-react";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/loaders";
import { ErrorState } from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils";

type AgentCard = {
  id: string;
  name: string;
  description: string;
  icon: string;
  source: "builtin" | "custom";
  locked?: boolean;
  favorite?: boolean;
  minPlan?: string;
  allowedTools?: string[];
};

type Stats = {
  activeAgents: number;
  tasksRunning: number;
  tasksCompleted: number;
  tasksFailed: number;
  automationCount: number;
};

const FILTERS = [
  { id: "all", label: "Barchasi" },
  { id: "builtin", label: "Tayyor" },
  { id: "mine", label: "Mening agentlarim" },
  { id: "favorites", label: "Sevimlilar" },
] as const;

export function AgentsHome() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [agents, setAgents] = useState<AgentCard[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetch(`/api/agents?filter=${filter}&stats=1`)
      .then(async (response) => {
        const json = (await response.json()) as { agents?: AgentCard[]; stats?: Stats; error?: string };
        if (!response.ok) throw new Error(json.error ?? "Yuklanmadi");
        setAgents(json.agents ?? []);
        setStats(json.stats ?? null);
        setError(null);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Yuklashda xatolik yuz berdi.");
        setAgents([]);
      });
  }, [filter]);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return agents ?? [];
    return (agents ?? []).filter(
      (item) => item.name.toLowerCase().includes(needle) || item.description.toLowerCase().includes(needle),
    );
  }, [agents, query]);

  return (
    <WorkspaceFrame title="Agentlar" subtitle="Tayyor va maxsus yordamchilar">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        {stats ? (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Faol agentlar" value={stats.activeAgents} />
            <StatCard label="Vazifalar" value={`${stats.tasksRunning} / ${stats.tasksCompleted}`} hint="jarayonda / yakunlangan" />
            <StatCard label="Xato" value={stats.tasksFailed} />
            <StatCard label="Avtomatlashtirish" value={stats.automationCount} />
          </section>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="block min-w-0 flex-1">
            <span className="sr-only">Qidirish</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Agent qidirish..."
              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Link href="/agents/favorites">
              <Button variant="secondary" size="sm">
                <Star size={14} /> Sevimlilar
              </Button>
            </Link>
            <Link href="/agents/create">
              <Button size="sm">
                <Plus size={14} /> Yangi agent
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 rounded-full border border-border p-1">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "min-h-10 flex-1 rounded-full px-3 text-sm",
                filter === item.id ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {agents === null ? <CardSkeleton /> : null}
        {error ? <ErrorState error={error} onRetry={load} /> : null}
        {agents && !error && visible.length === 0 ? (
          <EmptyState
            title="Agent topilmadi"
            description="Tayyor agentlardan boshlang yoki maxsus agent yarating."
            action={
              <Link href="/agents/create">
                <Button>Yaratish</Button>
              </Link>
            }
          />
        ) : null}

        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((agent) => (
            <li key={agent.id}>
              <Link
                href={`/agents/${agent.id}`}
                className="block rounded-[1.4rem] border border-border bg-card p-4 hover:bg-surface-2"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#4f7cff_0%,#8b5cf6_100%)] text-white">
                    <Bot size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{agent.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{agent.description}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-wider text-muted">
                      {agent.source === "builtin" ? "Tayyor" : "Maxsus"}
                      {agent.locked ? " · tarif kerak" : ""}
                      {agent.favorite ? " · sevimli" : ""}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </WorkspaceFrame>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <article className="rounded-[1.4rem] border border-border bg-card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </article>
  );
}
