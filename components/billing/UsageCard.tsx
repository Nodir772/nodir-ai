"use client";

import { cn } from "@/lib/utils";
import { PlanBadge } from "@/components/billing/PlanBadge";

export { PlanBadge };

export function UsageProgress({ used, limit }: { used: number; limit: number }) {
  const unbounded = limit <= 0;
  const pct = unbounded ? 8 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const tone = unbounded ? "bg-[linear-gradient(90deg,#4f7cff,#8b5cf6)]" : pct >= 100 ? "bg-red-400" : pct >= 80 ? "bg-amber-400" : "bg-[linear-gradient(90deg,#4f7cff,#8b5cf6)]";
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
      <div className={cn("h-full rounded-full transition-[width]", tone)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function UsageCard({
  label,
  used,
  limit,
  unit,
  className,
}: {
  label: string;
  used: number;
  limit: number;
  unit?: string;
  className?: string;
}) {
  const unbounded = limit <= 0;
  const remaining = unbounded ? null : Math.max(0, Math.round((limit - used) * 10) / 10);
  const percent = unbounded ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const usedLabel = Number.isInteger(used) ? String(used) : used.toFixed(1);
  const limitLabel = unbounded ? "∞" : String(limit);
  return (
    <article className={cn("rounded-2xl border border-border bg-card/80 p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-[11px] text-muted">{unbounded ? "Cheksiz" : `${percent}%`}</p>
      </div>
      <p className="mt-2 font-display text-2xl">
        {usedLabel}
        <span className="text-base font-medium text-muted"> / {limitLabel}</span>
        {unit ? <span className="ml-1 text-sm font-medium text-muted">{unit}</span> : null}
      </p>
      {remaining !== null ? (
        <p className="mt-1 text-xs text-muted">{remaining} qoldi</p>
      ) : (
        <p className="mt-1 text-xs text-muted">Limit qo&apos;yilmagan</p>
      )}
      <UsageProgress used={used} limit={limit} />
    </article>
  );
}
