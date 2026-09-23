"use client";

import { personalWorkspace } from "@/lib/workspaces/personal";

export function WorkspaceSwitcher() {
  const current = personalWorkspace();
  return (
    <div className="px-2">
      <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        Ish maydoni
      </p>
      <div className="flex min-h-11 items-center rounded-xl border border-border bg-card px-3 text-sm">
        <span className="truncate">{current.name}</span>
      </div>
    </div>
  );
}
