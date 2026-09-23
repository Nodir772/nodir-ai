"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/loaders";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { useAuth } from "@/components/auth/AuthProvider";
import { useI18n } from "@/components/i18n/LocaleProvider";

type UsageSnap = { used: number; limit: number };
type Usage = {
  plan: string;
  planName: string;
  resetAt: string;
  messages: UsageSnap;
  images: UsageSnap;
  documents: UsageSnap;
};

const ACTIONS = [
  { href: "/chat", label: "Chat" },
  { href: "/studio", label: "Studio" },
  { href: "/agents", label: "Agentlar" },
  { href: "/tasks", label: "Vazifalar" },
  { href: "/projects", label: "Loyihalar" },
  { href: "/studio/image", label: "Rasm" },
];

export function DashboardHome() {
  const { user } = useAuth();
  const { t } = useI18n();
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Xayrli tong" : hour < 18 ? "Xayrli kun" : "Xayrli kech";
  const [usage, setUsage] = useState<Usage | null>(null);
  const [chats, setChats] = useState<{ id: string; title: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [images, setImages] = useState<{ id: string; prompt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetch("/api/usage").then((r) => r.json()),
      fetch("/api/conversations").then((r) => r.json()),
      fetch("/api/projects?limit=5").then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()).catch(() => ({})),
      fetch("/api/images?limit=4").then((r) => r.json()).catch(() => ({})),
      fetch("/api/favorites").then((r) => r.json()).catch(() => ({})),
    ]).then(([usageJson, chatsJson, projectsJson, agentsJson, imagesJson, favJson]) => {
      if (cancelled) return;
      setUsage((usageJson as { usage?: Usage }).usage ?? null);
      setChats(((chatsJson as { conversations?: { id: string; title: string }[] }).conversations ?? []).slice(0, 6));
      setProjects((projectsJson as { projects?: { id: string; name: string }[] }).projects ?? []);
      const allAgents = ((agentsJson as { agents?: { id: string; name: string }[] }).agents ?? []).slice(0, 6);
      const favIds = new Set(
        ((favJson as { favorites?: { itemType?: string; item_type?: string; itemId?: string; item_id?: string }[] }).favorites ?? [])
          .filter((item) => (item.itemType ?? item.item_type) === "agent")
          .map((item) => item.itemId ?? item.item_id),
      );
      setAgents(allAgents.filter((agent) => favIds.has(agent.id)).slice(0, 4));
      if (!favIds.size) setAgents(allAgents.slice(0, 4));
      setImages(((imagesJson as { images?: { id: string; prompt: string }[] }).images ?? []).slice(0, 4));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <WorkspaceFrame title={t("nav.home")} subtitle={`${hello}, ${user?.name ?? "Nodir"}`}>
      <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
        <section className="rounded-[1.6rem] border border-border bg-card/80 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{t("dashboard.greeting")}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {hello}, {user?.name ?? "Nodir"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">Chat, Studio, agentlar va loyihalar — ishni shu yerdan davom ettiring.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ACTIONS.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="outline" size="sm">
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-[1.4rem] border border-border bg-card/80 p-4 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{t("dashboard.subscription")}</h2>
              <PlanBadge plan={usage?.plan ?? user?.plan ?? "free"} />
            </div>
            <p className="mt-2 text-sm text-muted">{usage?.planName ?? "Free"}</p>
            <Link href="/settings/billing" className="mt-3 inline-block text-sm text-accent">
              Tariflar
            </Link>
          </article>
          <article className="rounded-[1.4rem] border border-border bg-card/80 p-4 lg:col-span-2">
            <h2 className="text-sm font-semibold">{t("dashboard.usage")}</h2>
            {loading ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <CardSkeleton />
              </div>
            ) : usage ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <UsageMini label="AI xabar" snap={usage.messages} />
                <UsageMini label="Rasmlar" snap={usage.images} />
                <UsageMini label="Hujjatlar" snap={usage.documents} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">{t("dashboard.empty")}</p>
            )}
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <ListCard
            title={t("dashboard.recentChats")}
            empty={t("dashboard.empty")}
            items={chats.map((item) => ({ href: `/chat/${item.id}`, label: item.title }))}
            moreHref="/chat"
          />
          <ListCard
            title={t("dashboard.recentProjects")}
            empty={t("dashboard.empty")}
            items={projects.map((item) => ({ href: `/projects/${item.id}`, label: item.name }))}
            moreHref="/projects"
          />
          <ListCard
            title={t("dashboard.favoriteAgents")}
            empty={t("dashboard.empty")}
            items={agents.map((item) => ({ href: `/agents/${item.id}`, label: item.name }))}
            moreHref="/agents"
          />
          <ListCard
            title="So'nggi rasmlar"
            empty={t("dashboard.empty")}
            items={images.map((item) => ({ href: "/studio/image", label: item.prompt.slice(0, 80) || item.id }))}
            moreHref="/studio/history"
          />
        </section>

        <section className="rounded-[1.4rem] border border-border bg-card/80 p-5">
          <h2 className="text-sm font-semibold">{t("dashboard.continue")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/tasks">
              <Button size="sm">Vazifalar</Button>
            </Link>
            <Link href="/automations">
              <Button size="sm" variant="outline">
                Avtomatlashtirish
              </Button>
            </Link>
            <Link href="/settings/memory">
              <Button size="sm" variant="outline">
                Xotira
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </WorkspaceFrame>
  );
}

function UsageMini({ label, snap }: { label: string; snap: UsageSnap }) {
  const percent = snap.limit <= 0 ? 0 : Math.min(100, Math.round((snap.used / Math.max(snap.limit, 1)) * 100));
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium">
        {snap.used} / {snap.limit}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#4f7cff,#8b5cf6)]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ListCard({
  title,
  empty,
  items,
  moreHref,
}: {
  title: string;
  empty: string;
  items: { href: string; label: string }[];
  moreHref: string;
}) {
  return (
    <article className="rounded-[1.4rem] border border-border bg-card/80 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link href={moreHref} className="text-xs text-accent">
          Barchasi
        </Link>
      </div>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.href + item.label}>
              <Link href={item.href} className="block truncate hover:text-accent">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={empty} className="py-6" />
      )}
    </article>
  );
}
