"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/loaders";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/toast-context";
import { useChat } from "@/components/chat/ChatProvider";
import { uploadFormData } from "@/lib/files/upload";
import type { Project } from "@/lib/projects/types";
import type { Memory } from "@/lib/memory/types";
import Link from "next/link";

type Tab = "chats" | "files" | "memory" | "tasks" | "settings";

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { createConversation } = useChat();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("chats");
  const [chats, setChats] = useState<{ id: string; title: string }[]>([]);
  const [files, setFiles] = useState<{ id: string; filename: string }[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [instructions, setInstructions] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [memoryDraft, setMemoryDraft] = useState("");
  const [tasks, setTasks] = useState<{ id: string; title: string; status: string }[]>([]);

  const load = useCallback(() => {
    void (async () => {
      try {
        const [projectRes, chatsRes, filesRes, memRes, tasksRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/chats`),
          fetch(`/api/projects/${projectId}/files`),
          fetch(`/api/projects/${projectId}/memories`),
          fetch(`/api/tasks?projectId=${projectId}`),
        ]);
        const projectJson = (await projectRes.json()) as { project?: Project; error?: string };
        if (!projectRes.ok || !projectJson.project) throw new Error(projectJson.error ?? "Loyiha topilmadi.");
        setProject(projectJson.project);
        setName(projectJson.project.name);
        setDescription(projectJson.project.description);
        setInstructions(projectJson.project.instructions);
        const chatsJson = (await chatsRes.json()) as { conversations?: { id: string; title: string }[] };
        setChats(chatsJson.conversations ?? []);
        const filesJson = (await filesRes.json()) as { files?: { id: string; filename: string }[] };
        setFiles(filesJson.files ?? []);
        const memJson = (await memRes.json()) as { memories?: Memory[] };
        setMemories(memJson.memories ?? []);
        const tasksJson = (await tasksRes.json()) as { tasks?: { id: string; title: string; status: string }[] };
        setTasks(tasksJson.tasks ?? []);
        setError(null);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Yuklashda xatolik yuz berdi.");
      }
    })();
  }, [projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function saveSettings() {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, instructions }),
    });
    const json = (await response.json()) as { project?: Project; error?: string };
    if (!response.ok || !json.project) {
      toast(json.error ?? "Saqlanmadi", "error");
      return;
    }
    setProject(json.project);
    toast("Sozlamalar saqlandi", "success");
  }

  async function addMemory() {
    const content = memoryDraft.trim();
    if (!content) return;
    const response = await fetch(`/api/projects/${projectId}/memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, category: "project" }),
    });
    const json = (await response.json()) as { memory?: Memory; error?: string };
    if (!response.ok) {
      toast(json.error ?? "Xotira saqlanmadi", "error");
      return;
    }
    setMemoryDraft("");
    load();
  }

  async function uploadFile(list: FileList | null) {
    if (!list?.length) return;
    const form = new FormData();
    form.append("file", list[0]!);
    form.append("projectId", projectId);
    try {
      const result = await uploadFormData("/api/documents", form);
      if (!result.ok) throw new Error("Yuklanmadi");
      toast("Fayl yuklandi", "success");
      load();
    } catch {
      toast("Fayl yuklanmadi", "error");
    }
  }

  if (error && !project) {
    return (
      <WorkspaceFrame title="Loyiha">
        <ErrorState error={error} onRetry={load} />
      </WorkspaceFrame>
    );
  }

  if (!project) {
    return (
      <WorkspaceFrame title="Loyiha">
        <CardSkeleton />
      </WorkspaceFrame>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "chats", label: "Suhbatlar" },
    { id: "files", label: "Fayllar" },
    { id: "memory", label: "Xotira" },
    { id: "tasks", label: "Vazifalar" },
    { id: "settings", label: "Sozlamalar" },
  ];

  return (
    <WorkspaceFrame title={project.name} subtitle={project.description || "Loyiha"}>
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">{project.name}</h1>
            <p className="mt-1 text-sm text-muted">{project.description || "Tavsif yo'q"}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                const next = !project.favorite;
                void fetch(`/api/projects/${projectId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ favorite: next }),
                });
                if (next) {
                  void fetch("/api/favorites", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ itemType: "project", itemId: project.id }),
                  });
                } else {
                  void fetch(`/api/favorites?itemType=project&itemId=${project.id}`, { method: "DELETE" });
                }
                setProject({ ...project, favorite: next });
              }}
            >
              <Star size={16} className={project.favorite ? "fill-accent text-accent" : undefined} />
              Sevimli
            </Button>
            <Button
              onClick={() => {
                void createConversation("chat", project.id).then((id) => {
                  if (id) router.push(`/chat/${id}`);
                });
              }}
            >
            Yangi suhbat
          </Button>
          </div>
        </header>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium">Loyiha yo&apos;riqnomasi</h2>
          <textarea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none"
            placeholder="AI shu loyihada qanday yordam bersin?"
          />
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="secondary" onClick={() => void saveSettings()}>
              Yo&apos;riqnomani saqlash
            </Button>
          </div>
        </section>

        <div className="flex gap-1 rounded-full border border-border p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex-1 rounded-full px-3 py-2 text-sm ${
                tab === item.id ? "bg-surface-2" : "text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "chats" ? (
          chats.length === 0 ? (
            <EmptyState
              title="Bu loyihada suhbat yo'q"
              description="Yangi suhbat oching — u avtomatik shu loyihaga bog'lanadi."
              action={
                <Button
                  onClick={() => {
                    void createConversation("chat", project.id).then((id) => {
                      if (id) router.push(`/chat/${id}`);
                    });
                  }}
                >
                  Suhbat boshlash
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <Link href={`/chat/${chat.id}`} className="block rounded-2xl border border-border bg-card px-4 py-3 hover:bg-surface-2">
                    {chat.title}
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === "files" ? (
          <div className="space-y-4">
            <label className="inline-flex cursor-pointer">
              <input
                type="file"
                className="sr-only"
                accept="image/*,.pdf,.docx,.txt,.csv"
                onChange={(event) => {
                  void uploadFile(event.target.files);
                  event.target.value = "";
                }}
              />
              <span className="inline-flex h-11 items-center rounded-full bg-surface-2 px-4 text-sm">Fayl yuklash</span>
            </label>
            {files.length === 0 ? (
              <EmptyState
                title="Fayllar yo'q"
                description="PDF, TXT, DOCX, CSV yoki rasm yuklang. Fayllar bajarilmaydi."
              />
            ) : (
              <ul className="space-y-2">
                {files.map((file) => (
                  <li key={file.id} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                    {file.filename}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {tab === "memory" ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={memoryDraft}
                onChange={(event) => setMemoryDraft(event.target.value)}
                placeholder="Loyiha xotirasiga yozing"
              />
              <Button onClick={() => void addMemory()}>Qo&apos;shish</Button>
            </div>
            {memories.length === 0 ? (
              <EmptyState title="Xotira bo'sh" description="Faqat shu loyihaga tegishli eslatmalar shu yerda." />
            ) : (
              <ul className="space-y-2">
                {memories.map((memory) => (
                  <li key={memory.id} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                    {memory.content}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {tab === "tasks" ? (
          tasks.length === 0 ? (
            <EmptyState
              title="Bu loyihada vazifa yo&apos;q"
              description="Agentdan vazifa ishga tushiring — loyiha yo'riqnomasi va fayllari qo'shiladi."
              action={
                <Link href="/agents">
                  <Button>Agentlarga o&apos;tish</Button>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li key={task.id}>
                  <Link href={`/tasks/${task.id}`} className="block rounded-2xl border border-border bg-card px-4 py-3 hover:bg-surface-2">
                    {task.title}
                    <span className="ml-2 text-xs text-muted">{task.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === "settings" ? (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <Field label="Nomi">
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Tavsif">
              <Input value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setDeleteOpen(true)}>
                O&apos;chirish
              </Button>
              <Button onClick={() => void saveSettings()}>Saqlash</Button>
            </div>
          </div>
        ) : null}
      </div>
      <ConfirmDialog
        open={deleteOpen}
        title="Loyihani o'chirish"
        description="Loyiha o'chiriladi. Suhbatlar saqlanadi, lekin loyihadan ajratiladi."
        confirmLabel="O'chirish"
        cancelLabel="Bekor qilish"
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          void fetch(`/api/projects/${projectId}`, { method: "DELETE" }).then((response) => {
            if (response.ok) router.push("/projects");
            else toast("O'chirilmadi", "error");
          });
        }}
      />
    </WorkspaceFrame>
  );
}
