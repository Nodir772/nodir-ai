"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/loaders";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";

type FavoriteRow = {
  id: string;
  item_type: "conversation" | "image" | "message" | "project" | "agent";
  item_id: string;
  title?: string;
  snippet?: string;
  created_at: string;
};

export function FavoritesView() {
  const [rows, setRows] = useState<FavoriteRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetch("/api/favorites")
      .then(async (response) => {
        const json = (await response.json()) as { favorites?: FavoriteRow[]; error?: string };
        if (!response.ok) throw new Error(json.error);
        setRows(json.favorites ?? []);
        setError(null);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Yuklashda xatolik yuz berdi.");
        setRows([]);
      });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const chats = (rows ?? []).filter((item) => item.item_type === "conversation");
  const replies = (rows ?? []).filter((item) => item.item_type === "message");
  const projects = (rows ?? []).filter((item) => item.item_type === "project");
  const agents = (rows ?? []).filter((item) => item.item_type === "agent");

  return (
    <WorkspaceFrame title="Sevimlilar" subtitle="Suhbatlar va saqlangan javoblar">
      <div className="mx-auto max-w-3xl space-y-8 p-4 sm:p-6">
        {rows === null ? <CardSkeleton /> : null}
        {error ? <ErrorState error={error} onRetry={load} /> : null}
        {rows && !error && rows.length === 0 ? (
          <EmptyState
            title="Hozircha sevimlilar yo'q"
            description="Suhbatni yulduzcha bilan belgilang yoki AI javobini yoqing."
            action={
              <Link href="/chat">
                <Button>Chatga o&apos;tish</Button>
              </Link>
            }
          />
        ) : null}
        {agents.length > 0 ? (
          <section>
            <h2 className="font-display text-lg font-semibold">Agentlar</h2>
            <ul className="mt-3 space-y-2">
              {agents.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/agents/${item.item_id}`}
                    className="block rounded-2xl border border-border bg-card px-4 py-3 hover:bg-surface-2"
                  >
                    <p className="truncate text-sm font-medium">{item.title ?? "Agent"}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {projects.length > 0 ? (
          <section>
            <h2 className="font-display text-lg font-semibold">Loyihalar</h2>
            <ul className="mt-3 space-y-2">
              {projects.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/projects/${item.item_id}`}
                    className="block rounded-2xl border border-border bg-card px-4 py-3 hover:bg-surface-2"
                  >
                    <p className="truncate text-sm font-medium">{item.title ?? "Loyiha"}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {chats.length > 0 ? (
          <section>
            <h2 className="font-display text-lg font-semibold">Suhbatlar</h2>
            <ul className="mt-3 space-y-2">
              {chats.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/chat/${item.item_id}`}
                    className="block rounded-2xl border border-border bg-card px-4 py-3 hover:bg-surface-2"
                  >
                    <p className="truncate text-sm font-medium">{item.title ?? "Suhbat"}</p>
                    {item.snippet ? <p className="mt-1 truncate text-xs text-muted">{item.snippet}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {replies.length > 0 ? (
          <section>
            <h2 className="font-display text-lg font-semibold">Saqlangan javoblar</h2>
            <ul className="mt-3 space-y-2">
              {replies.map((item) => (
                <li key={item.id} className="rounded-2xl border border-border bg-card px-4 py-3">
                  <p className="text-sm leading-6">{item.snippet ?? item.title ?? "Javob"}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </WorkspaceFrame>
  );
}
