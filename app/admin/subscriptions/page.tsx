"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { PLAN_LIST } from "@/lib/billing/plans";

type Row = {
  user_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  provider: string;
};

type Totals = {
  plans: { free: number; pro: number; pro_plus: number; pro_max: number };
  status: { active: number; canceled: number; past_due: number; trialing: number; other: number };
  total: number;
};

export default function AdminSubscriptionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);

  useEffect(() => {
    void fetch("/api/admin/subscriptions")
      .then((response) => response.json())
      .then((json: { subscriptions?: Row[]; totals?: Totals }) => {
        setRows(json.subscriptions ?? []);
        setTotals(json.totals ?? null);
      })
      .catch(() => undefined);
  }, []);

  const planMax = Math.max(1, ...(totals ? Object.values(totals.plans) : [1]));
  const statusMax = Math.max(1, ...(totals ? Object.values(totals.status) : [1]));

  return (
    <AdminShell title="Obunalar">
      {totals ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_LIST.map((plan) => (
            <article key={plan.id} className="rounded-2xl border border-border bg-card/80 p-4">
              <p className="flex items-center justify-between text-xs text-muted">
                {plan.name}
                <PlanBadge plan={plan.id} />
              </p>
              <p className="mt-2 font-display text-2xl">{totals.plans[plan.id]}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#4f7cff,#8b5cf6)]"
                  style={{ width: `${Math.round((totals.plans[plan.id] / planMax) * 100)}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      ) : null}
      {totals ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Faol", totals.status.active],
              ["Bekor", totals.status.canceled],
              ["To'lov kechikkan", totals.status.past_due],
              ["Sinov", totals.status.trialing],
            ] as const
          ).map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-border bg-card/80 p-4">
              <p className="text-xs text-muted">{label}</p>
              <p className="mt-2 font-display text-2xl">{value}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#8b5cf6,#4f7cff)]"
                  style={{ width: `${Math.round((value / statusMax) * 100)}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-[640px] w-full text-left text-sm">
          <thead className="bg-surface-2/50 text-muted">
            <tr>
              <th className="px-3 py-2">Foydalanuvchi</th>
              <th className="px-3 py-2">Reja</th>
              <th className="px-3 py-2">Holat</th>
              <th className="px-3 py-2">Davr oxiri</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.user_id} className="border-t border-border">
                <td className="px-3 py-3 font-mono text-xs">{row.user_id.slice(0, 8)}…</td>
                <td className="px-3 py-3">
                  <PlanBadge plan={row.plan} />
                </td>
                <td className="px-3 py-3">{row.status}</td>
                <td className="px-3 py-3 text-muted">
                  {row.current_period_end ? new Date(row.current_period_end).toLocaleDateString("uz-UZ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
