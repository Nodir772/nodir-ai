"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { CardSkeleton } from "@/components/ui/loaders";

type Totals = {
  users: number;
  newUsers?: number;
  activeUsers?: number;
  free: number;
  pro: number;
  pro_plus: number;
  pro_max: number;
  chat: number;
  image: number;
  documents: number;
};

export default function AdminHomePage() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void fetch("/api/admin/overview")
      .then((response) => response.json())
      .then((json: { totals?: Totals; notice?: string }) => {
        setTotals(json.totals ?? null);
        setNotice(json.notice ?? "");
      })
      .catch(() => undefined);
  }, []);

  const cards = totals
    ? [
        ["Foydalanuvchilar", totals.users],
        ["Faol (7 kun)", totals.activeUsers ?? 0],
        ["Yangi (7 kun)", totals.newUsers ?? 0],
        ["Free", totals.free],
        ["Pro", totals.pro],
        ["Pro Plus", totals.pro_plus],
        ["Pro Max", totals.pro_max],
        ["AI so'rovlar", totals.chat],
        ["Rasmlar", totals.image],
        ["Hujjatlar", totals.documents],
      ]
    : [];

  const max = Math.max(1, ...cards.map((item) => Number(item[1])));

  return (
    <AdminShell title="Admin">
      {notice ? <p className="mb-4 text-sm text-muted">{notice}</p> : null}
      {!totals ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-border bg-card/80 p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-2 font-display text-2xl">{value}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#4f7cff,#8b5cf6)]"
                style={{ width: `${Math.round((Number(value) / max) * 100)}%` }}
              />
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
