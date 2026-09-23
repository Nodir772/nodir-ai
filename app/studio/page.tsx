"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StudioShell } from "@/components/studio/StudioShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

const ACTIONS = [
  { href: "/chat", label: "Chat" },
  { href: "/studio/image", label: "Rasm" },
  { href: "/studio/documents", label: "Hujjat" },
  { href: "/studio/writing", label: "Yozish" },
  { href: "/studio/code", label: "Kod" },
  { href: "/studio/research", label: "Tadqiqot" },
  { href: "/studio/translate", label: "Tarjima" },
  { href: "/studio/summarize", label: "Xulosa" },
  { href: "/studio/voice", label: "Ovoz" },
  { href: "/studio/screenshot", label: "Skrinshot" },
];

export default function StudioHomePage() {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [chats, setChats] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    void fetch("/api/projects?limit=4")
      .then((response) => response.json())
      .then((json: { projects?: { id: string; name: string }[] }) => setProjects(json.projects ?? []))
      .catch(() => undefined);
    void fetch("/api/conversations")
      .then((response) => response.json())
      .then((json: { conversations?: { id: string; title: string }[] }) => setChats((json.conversations ?? []).slice(0, 4)))
      .catch(() => undefined);
  }, []);

  return (
    <StudioShell title="AI Studio" subtitle="Create anything with Nodir AI">
      <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
        <section>
          <h2 className="font-display text-2xl font-semibold">Nodir AI bilan yarating</h2>
          <p className="mt-2 text-sm text-muted">Matn, rasm, hujjat, kod, tadqiqot va ovoz — bitta joyda.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ACTIONS.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="outline" size="sm">{item.label}</Button>
              </Link>
            ))}
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-[1.4rem] border border-border p-4">
            <h3 className="text-sm font-semibold">So&apos;nggi loyihalar</h3>
            {projects.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {projects.map((project) => (
                  <li key={project.id}>
                    <Link href={`/projects/${project.id}`} className="text-accent">{project.name}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Hozircha loyiha yo'q" description="Loyiha ochib ishni saqlang." className="py-6" />
            )}
          </article>
          <article className="rounded-[1.4rem] border border-border p-4">
            <h3 className="text-sm font-semibold">So&apos;nggi suhbatlar</h3>
            {chats.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {chats.map((chat) => (
                  <li key={chat.id}>
                    <Link href={`/chat/${chat.id}`} className="text-accent">{chat.title}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Yangi suhbat boshlang" className="py-6" />
            )}
          </article>
        </section>
        <p className="text-sm">
          <Link href="/studio/history" className="text-accent">Studio tarixi</Link>
        </p>
      </div>
    </StudioShell>
  );
}
