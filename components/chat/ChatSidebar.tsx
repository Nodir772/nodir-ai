"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  Code2,
  FileText,
  FolderKanban,
  Globe,
  ImageIcon,
  ListTodo,
  MessageSquare,
  Mic,
  PenLine,
  Plus,
  Settings,
  Sparkles,
  Star,
  TextQuote,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ConversationList } from "@/components/chat/ConversationList";
import { ProfileMenu } from "@/components/chat/ProfileMenu";
import { useChat } from "@/components/chat/ChatProvider";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";
import { AI_TOOLS, type AiToolId } from "@/lib/ai/tools";
import { cn } from "@/lib/utils";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { useAuth } from "@/components/auth/AuthProvider";

const TOOL_ICONS: Record<AiToolId, typeof MessageSquare> = {
  chat: MessageSquare,
  translate: Globe,
  writer: PenLine,
  code: Code2,
  image: ImageIcon,
  documents: FileText,
  summarizer: TextQuote,
};

const FILTERS = [
  { id: "all", label: "Barchasi" },
  { id: "chats", label: "Suhbatlar" },
  { id: "projects", label: "Loyihalar" },
  { id: "files", label: "Fayllar" },
] as const;

type SearchHit = {
  chats: { id: string; title: string }[];
  projects: { id: string; name: string }[];
  files: { id: string; filename: string }[];
};

export function ChatSidebar({
  onClose,
  onSettings,
  onRename,
  onDelete,
  onShare,
  onExport,
}: {
  onClose?: () => void;
  onSettings: () => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onShare?: (id: string) => void;
  onExport?: (id: string) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { conversations, active, activeId, createConversation, selectConversation, toggleFavorite, loadingConversations, creatingConversation } =
    useChat();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [hits, setHits] = useState<SearchHit | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    void fetch("/api/projects?limit=8")
      .then((response) => response.json())
      .then((json: { projects?: { id: string; name: string }[] }) => {
        setProjects(json.projects ?? []);
      })
      .catch(() => undefined);
  }, [pathname]);

  useEffect(() => {
    if (!debounced) return;
    let cancelled = false;
    void fetch(`/api/workspace/search?q=${encodeURIComponent(debounced)}&filter=${filter}`)
      .then((response) => response.json())
      .then((json: SearchHit) => {
        if (!cancelled) setHits(json);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [debounced, filter]);

  const visible = useMemo(() => {
    if (!debounced) return conversations;
    if (hits) {
      const ids = new Set(hits.chats.map((item) => item.id));
      return conversations.filter((item) => ids.has(item.id));
    }
    const needle = debounced.toLowerCase();
    return conversations.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        item.messages.some((message) => message.content.toLowerCase().includes(needle)),
    );
  }, [conversations, debounced, hits]);

  const favorites = conversations.filter((item) => item.favorite);
  const searching = Boolean(debounced);

  return (
    <div className="flex h-full w-[270px] shrink-0 flex-col border-r border-border bg-secondary">
      <div className="p-4 pb-2">
        <Link href="/home" onClick={onClose}>
          <Logo size="sm" />
        </Link>
        <button
          type="button"
          disabled={creatingConversation}
          onClick={() => {
            void createConversation(active?.mode ?? "chat").then((id) => {
              if (id) router.push(`/chat/${id}`);
            });
            onClose?.();
          }}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#4f7cff_0%,#8b5cf6_100%)] text-sm font-medium text-white shadow-[0_10px_30px_-16px_rgba(99,102,241,1)] disabled:opacity-60"
        >
          {creatingConversation ? "Yaratilmoqda..." : (
            <>
              <Plus size={16} /> Yangi suhbat
            </>
          )}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <label className="block px-2 pb-2">
          <span className="sr-only">Qidirish</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Qidirish..."
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
          />
        </label>
        {searching ? (
          <div className="mb-2 flex flex-wrap gap-1 px-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px]",
                  filter === item.id ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        {!searching ? (
          <>
            <div className="mb-3">
              <div className="flex items-center justify-between px-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Loyihalar</p>
                <button
                  type="button"
                  className="text-xs text-accent"
                  onClick={() => setCreateOpen(true)}
                >
                  Yangi
                </button>
              </div>
              {projects.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted">Hozircha loyiha yo&apos;q.</p>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {projects.map((project) => (
                    <li key={project.id}>
                      <Link
                        href={`/projects/${project.id}`}
                        onClick={onClose}
                        className={cn(
                          "flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm",
                          pathname === `/projects/${project.id}`
                            ? "bg-surface-2 text-foreground"
                            : "text-muted hover:bg-surface-2 hover:text-foreground",
                        )}
                      >
                        <FolderKanban size={14} />
                        <span className="truncate">{project.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/projects"
                onClick={onClose}
                className="mt-1 block px-3 text-xs text-accent"
              >
                Barcha loyihalar
              </Link>
            </div>
            <WorkspaceSwitcher />
          </>
        ) : null}

        {searching && hits && (filter === "all" || filter === "projects") && hits.projects.length > 0 ? (
          <div className="mb-3">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Loyihalar</p>
            <ul className="mt-1">
              {hits.projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    onClick={onClose}
                    className="block truncate rounded-xl px-3 py-2 text-sm hover:bg-surface-2"
                  >
                    {project.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {searching && hits && (filter === "all" || filter === "files") && hits.files.length > 0 ? (
          <div className="mb-3">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Fayllar</p>
            <ul className="mt-1">
              {hits.files.map((file) => (
                <li key={file.id} className="truncate px-3 py-1.5 text-sm text-muted">
                  {file.filename}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {(!searching || filter === "all" || filter === "chats") ? (
          <>
            <div className="mb-2 border-t border-border pt-3">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Chat tarixi</p>
            </div>
            {loadingConversations ? (
              <div className="space-y-2 px-3 py-2">
                <div className="h-10 animate-pulse rounded-xl bg-surface-2" />
                <div className="h-10 animate-pulse rounded-xl bg-surface-2" />
                <div className="h-10 animate-pulse rounded-xl bg-surface-2" />
              </div>
            ) : (
              <ConversationList
                conversations={visible}
                activeId={activeId}
                query={debounced}
                onSelect={(id) => {
                  void selectConversation(id);
                  router.push(`/chat/${id}`);
                  onClose?.();
                }}
                onRename={onRename}
                onDelete={onDelete}
                onFavorite={toggleFavorite}
                onShare={onShare}
                onExport={onExport}
              />
            )}
          </>
        ) : null}

        {!searching && favorites.length > 0 ? (
          <div className="mt-4">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Sevimlilar</p>
            <ul className="mt-1 px-2 text-sm text-muted">
              {favorites.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full truncate rounded-xl px-2 py-1.5 text-left hover:bg-surface-2 hover:text-foreground"
                    onClick={() => {
                      void selectConversation(item.id);
                      router.push(`/chat/${item.id}`);
                      onClose?.();
                    }}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!searching ? (
          <nav className="mt-4 space-y-0.5 border-t border-border pt-3" aria-label="Vositalar">
            {AI_TOOLS.map((tool) => {
              const current =
                tool.href === "/chat"
                  ? pathname === "/chat" || pathname.startsWith("/chat/")
                  : pathname === tool.href || pathname.startsWith(`${tool.href}/`);
              const Icon = TOOL_ICONS[tool.id];
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  onClick={onClose}
                  className={cn(
                    "flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-sm",
                    current ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  <Icon size={16} aria-hidden />
                  {tool.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
      <div className="space-y-2 border-t border-border p-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted">Reja</span>
          <PlanBadge plan={user?.plan ?? "free"} />
        </div>
        <Link
          href="/studio"
          onClick={onClose}
          className={cn(
            "flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm",
            pathname.startsWith("/studio") ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground",
          )}
        >
          <Sparkles size={16} /> Studio
        </Link>
        <Link
          href="/agents"
          onClick={onClose}
          className={cn(
            "flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm",
            pathname.startsWith("/agents") ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground",
          )}
        >
          <Bot size={16} /> Agentlar
        </Link>
        <Link
          href="/tasks"
          onClick={onClose}
          className={cn(
            "flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm",
            pathname.startsWith("/tasks") ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground",
          )}
        >
          <ListTodo size={16} /> Vazifalar
        </Link>
        <Link
          href="/automations"
          onClick={onClose}
          className={cn(
            "flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm",
            pathname.startsWith("/automations") ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground",
          )}
        >
          <Workflow size={16} /> Avtomatlashtirish
        </Link>
        <Link
          href="/favorites"
          onClick={onClose}
          className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <Star size={16} /> Sevimlilar
        </Link>
        <Link
          href="/voice"
          onClick={onClose}
          className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <Mic size={16} /> Ovoz
        </Link>
        <button
          type="button"
          onClick={onSettings}
          className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <Settings size={16} /> Sozlamalar
        </button>
        <ProfileMenu onSettings={onSettings} />
      </div>
      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
