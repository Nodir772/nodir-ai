"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/loaders";
import { Button } from "@/components/ui/Button";

type AgentCard = { id: string; name: string; description: string; favorite?: boolean };

export default function AgentFavoritesPage() {
  const [agents, setAgents] = useState<AgentCard[] | null>(null);

  const load = useCallback(() => {
    void fetch("/api/agents?filter=favorites")
      .then((response) => response.json())
      .then((json: { agents?: AgentCard[] }) => setAgents(json.agents ?? []))
      .catch(() => setAgents([]));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <WorkspaceFrame title="Sevimli agentlar">
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        {agents === null ? <CardSkeleton /> : null}
        {agents && agents.length === 0 ? (
          <EmptyState
            title="Sevimli agent yo&apos;q"
            action={
              <Link href="/agents">
                <Button>Agentlarga o&apos;tish</Button>
              </Link>
            }
          />
        ) : null}
        <ul className="space-y-2">
          {(agents ?? []).map((agent) => (
            <li key={agent.id}>
              <Link href={`/agents/${agent.id}`} className="block rounded-2xl border border-border bg-card px-4 py-3">
                {agent.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </WorkspaceFrame>
  );
}
