"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/loaders";
import { ErrorState } from "@/components/ui/ErrorState";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { useToast } from "@/components/ui/toast-context";
import { conversationToMarkdown, downloadText } from "@/lib/export/conversation";
import { cn } from "@/lib/utils";

type TaskView = {
  id: string;
  title: string;
  input: string;
  status: string;
  summary: string;
  result: string;
  sources: { title: string; url: string; snippet: string }[];
  files: { id: string; filename: string }[];
  toolsUsed: string[];
  currentStep: number;
  stepCount: number;
  currentLabel: string | null;
  steps: { id: string; index: number; label: string; status: string }[];
  error: string | null;
  durationMs: number | null;
};

export function TaskDetail({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [task, setTask] = useState<TaskView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetch(`/api/tasks/${taskId}`)
      .then(async (response) => {
        const json = (await response.json()) as { task?: TaskView; error?: string };
        if (!response.ok || !json.task) throw new Error(json.error ?? "Topilmadi");
        setTask(json.task);
        setError(null);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Yuklashda xatolik yuz berdi.");
      });
  }, [taskId]);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (task?.status !== "running") return;
    const timer = window.setInterval(() => load(), 2500);
    return () => window.clearInterval(timer);
  }, [load, task?.status]);

  async function act(path: string) {
    const response = await fetch(path, { method: "POST" });
    const json = (await response.json()) as { task?: TaskView; error?: string };
    if (!response.ok) {
      toast(json.error ?? "Amal bajarilmadi", "error");
      return;
    }
    if (json.task) setTask(json.task);
    else load();
  }

  async function share() {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true, title: task?.title, content: task?.result }),
    });
    const json = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !json.url) toast(json.error ?? "Ulashilmadi", "error");
    else {
      await navigator.clipboard.writeText(`${window.location.origin}${json.url}`);
      toast("Havola nusxalandi", "success");
    }
  }

  if (error && !task) {
    return (
      <WorkspaceFrame title="Vazifa">
        <ErrorState error={error} onRetry={load} />
      </WorkspaceFrame>
    );
  }
  if (!task) {
    return (
      <WorkspaceFrame title="Vazifa">
        <CardSkeleton />
      </WorkspaceFrame>
    );
  }

  return (
    <WorkspaceFrame title={task.title} subtitle={`${task.status} · Qadam ${task.currentStep} / ${task.stepCount}`}>
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <p className="text-sm text-muted">{task.currentLabel ? `Hozir: ${task.currentLabel}` : null}</p>
        <ol className="space-y-2">
          {task.steps.map((step) => (
            <li
              key={step.id}
              className={cn(
                "rounded-2xl border border-border px-4 py-3 text-sm",
                step.status === "completed" ? "bg-card" : "bg-background",
              )}
            >
              <span className="text-muted">Qadam {step.index + 1} · </span>
              {step.label} — {step.status}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          {task.status === "pending" || task.status === "paused" ? (
            <Button onClick={() => void act(`/api/tasks/${taskId}/run`)}>Davom ettirish</Button>
          ) : null}
          {task.status === "running" ? (
            <>
              <Button variant="secondary" onClick={() => void fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paused" }) }).then(load)}>
                Pauza
              </Button>
              <Button variant="outline" onClick={() => void act(`/api/tasks/${taskId}/cancel`)}>
                Bekor qilish
              </Button>
            </>
          ) : null}
          {task.status === "failed" || task.status === "cancelled" ? (
            <Button onClick={() => void act(`/api/tasks/${taskId}/retry`)}>Qayta urinish</Button>
          ) : null}
        </div>
        {task.error ? <p className="text-sm text-red-400">{task.error}</p> : null}
        {task.summary ? <p className="text-sm text-muted">{task.summary}</p> : null}
        {task.result ? (
          <section className="rounded-[1.4rem] border border-border bg-card p-4">
            <h2 className="font-medium">Natija</h2>
            <div className="mt-2">
              <ChatMarkdown content={task.result} />
            </div>
          </section>
        ) : null}
        {task.sources.length > 0 ? (
          <section>
            <h2 className="font-medium">Manbalar</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {task.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} className="text-accent" target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {task.files.length > 0 ? (
          <p className="text-sm text-muted">Fayllar: {task.files.map((file) => file.filename).join(", ")}</p>
        ) : null}
        <p className="text-xs text-muted">
          Davomiyligi: {task.durationMs ? `${Math.round(task.durationMs / 1000)} s` : "—"} · Vositalar: {task.toolsUsed.join(", ") || "yo'q"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              const md = conversationToMarkdown(task.title, new Date().toISOString(), [
                { role: "user", content: task.input },
                { role: "assistant", content: task.result },
              ]);
              downloadText(`${task.title}.md`, md, "text/markdown");
            }}
          >
            Export
          </Button>
          <Button variant="secondary" onClick={() => void share()}>
            Ulashish
          </Button>
          <Button variant="outline" onClick={() => router.push("/chat")}>
            Chatda davom ettirish
          </Button>
        </div>
      </div>
    </WorkspaceFrame>
  );
}
