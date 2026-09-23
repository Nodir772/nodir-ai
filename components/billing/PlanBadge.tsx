"use client";

import { cn } from "@/lib/utils";
import { getPlan, resolvePlanId } from "@/lib/billing/plans";

const TONE: Record<string, string> = {
  free: "border-border bg-surface-2/80 text-muted",
  pro: "border-accent/40 bg-accent/10 text-accent",
  pro_plus: "border-violet-400/50 bg-violet-500/15 text-violet-200",
  pro_max: "border-amber-400/50 bg-amber-500/15 text-amber-200",
};

export function PlanBadge({ plan, className }: { plan: string; className?: string }) {
  const id = resolvePlanId(plan);
  const label = getPlan(id).name;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE[id],
        className,
      )}
    >
      {label}
    </span>
  );
}
