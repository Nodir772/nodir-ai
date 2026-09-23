"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/loaders";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import Link from "next/link";

type ProjectRow = {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
};

export function ProjectsHome() {
  const [rows, setRows] = useState<ProjectRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(() => {
    void fetch("/api/projects")
      .then(async (response) => {
        const json = (await response.json()) as { projects?: ProjectRow[]; error?: string };
        if (!response.ok) throw new Error(json.error);
        setRows(json.projects ?? []);
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

  return (
    <WorkspaceFrame title="Loyihalar" subtitle="Suhbat, fayl va xotirani bitta joyda saqlang">
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold">Loyihalar</h1>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Yangi loyiha
          </Button>
        </div>
        {rows === null ? <CardSkeleton /> : null}
        {error ? <ErrorState error={error} onRetry={load} /> : null}
        {rows && !error && rows.length === 0 ? (
          <EmptyState
            title="Hozircha loyiha yo'q"
            description="Birinchi loyihangizni yarating — suhbatlar, fayllar va xotira shu yerda yig'iladi."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} /> Loyiha yaratish
              </Button>
            }
          />
        ) : null}
        {rows && rows.length > 0 ? (
          <ul className="space-y-2">
            {rows.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="block rounded-2xl border border-border bg-card px-4 py-4 hover:bg-surface-2"
                >
                  <p className="font-medium">{project.name}</p>
                  {project.description ? (
                    <p className="mt-1 text-sm text-muted">{project.description}</p>
                  ) : (
                    <p className="mt-1 text-sm text-muted">Tavsif yo&apos;q</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <CreateProjectModal open={createOpen} onClose={() => { setCreateOpen(false); load(); }} />
    </WorkspaceFrame>
  );
}
