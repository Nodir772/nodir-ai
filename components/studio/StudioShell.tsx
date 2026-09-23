"use client";

import type { ReactNode } from "react";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { StudioToolPanel } from "@/components/studio/StudioToolPanel";

export function StudioShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <WorkspaceFrame title={title} subtitle={subtitle}>
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <aside className="border-b border-border p-3 lg:w-52 lg:shrink-0 lg:border-r lg:border-b-0">
          <StudioToolPanel />
        </aside>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </WorkspaceFrame>
  );
}
