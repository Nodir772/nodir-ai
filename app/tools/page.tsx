"use client";

import Link from "next/link";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { AI_TOOLS } from "@/lib/ai/tools";

export default function ToolsIndexPage() {
  return (
    <WorkspaceFrame title="Vositalar" subtitle="Ishlatiladigan AI vositalari">
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {AI_TOOLS.filter((tool) => tool.id !== "chat").map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className="rounded-2xl border border-border bg-card/80 p-5 text-sm hover:border-accent/40"
          >
            <p className="font-medium">{tool.label}</p>
            <p className="mt-1 text-muted">{tool.subtitle}</p>
          </Link>
        ))}
      </div>
    </WorkspaceFrame>
  );
}
