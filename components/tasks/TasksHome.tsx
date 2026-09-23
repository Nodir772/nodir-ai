"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/loaders";
import { ErrorState } from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  kind: string;
  currentStep: number;
  stepCount: number;
  updatedAt: string;
};

export function TasksHome({ history = false }: { history?: boolean }) {
  const [rows, setRows] = useState<TaskRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetch(`/api/tasks${history ? "?history=1" : ""}`)
      .then(async (response) => {
        const json = (await response.json()) as { tasks?: TaskRow[]; error?: string };
        if (!response.ok) throw new Error(json.error);
        setRows(json.tasks ?? []);
        setError(null);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Yuklashda xatolik yuz berdi.");
        setRows([]);
      });
  }, [history]);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <WorkspaceFrame title={history ? "Vazifalar tarixi" : "Vazifalar"} subtitle="Cheklangan qadamlardan iborat ishlar">
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <div className="flex gap-2">
          <Link href="/tasks">
            <Button size="sm" variant={history ? "secondary" : "primary"}>
              Faol
            </Button>
          </Link>
          <Link href="/tasks/history">
            <Button size="sm" variant={history ? "primary" : "secondary"}>
              Tarix
            </Button>
          </Link>
          <Link href="/agents">
            <Button size="sm" variant="outline">
              Agentdan boshlash
            </Button>
          </Link>
        </div>
        {rows === null ? <CardSkeleton /> : null}
        {error ? <ErrorState error={error} onRetry={load} /> : null}
        {rows && !error && rows.length === 0 ? (
          <EmptyState title="Vazifa yo'q" description="Agent sahifasidan vazifa ishga tushiring." />
        ) : null}
        <ul className="space-y-2">
          {(rows ?? []).map((task) => (
            <li key={task.id}>
              <Link href={`/tasks/${task.id}`} className="block rounded-2xl border border-border bg-card px-4 py-3 hover:bg-surface-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium">{task.title}</p>
                  <span className={cn("text-xs capitalize text-muted")}>{task.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Qadam {task.currentStep} / {task.stepCount} · {task.kind}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </WorkspaceFrame>
  );
}
