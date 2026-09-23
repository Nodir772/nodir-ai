"use client";

import { Download, Pencil, Share2, Star, Trash2 } from "lucide-react";
import { conversationGroup, formatChatTime } from "@/lib/chat/dates";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/chat";

const ORDER = ["Bugun", "Kecha", "Oxirgi 7 kun", "Eski"] as const;

function Highlight({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>;
  const needle = query.trim();
  if (!needle) return <>{text}</>;
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-accent/30 text-foreground">{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
}

export function ConversationList({
  conversations,
  activeId,
  query,
  onSelect,
  onRename,
  onDelete,
  onFavorite,
  onShare,
  onExport,
}: {
  conversations: Conversation[];
  activeId: string | null;
  query?: string;
  onSelect: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onFavorite: (id: string) => void;
  onShare?: (id: string) => void;
  onExport?: (id: string) => void;
}) {
  const grouped = ORDER.map((label) => ({
    label,
    items: conversations.filter((item) => conversationGroup(item.updatedAt) === label),
  })).filter((group) => group.items.length > 0);

  if (conversations.length === 0) {
    return (
      <p className="px-3 py-2 text-xs text-muted">
        {query?.trim() ? "Hech narsa topilmadi." : "Hozircha suhbat yo'q."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <section key={group.label}>
          <h3 className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {group.label}
          </h3>
          <ul className="mt-1 space-y-0.5">
            {group.items.map((item) => (
              <li key={item.id}>
                <div
                  className={cn(
                    "group flex items-center gap-1 rounded-xl px-2 py-1.5",
                    item.id === activeId ? "bg-surface-2" : "hover:bg-surface-2/70",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className="min-h-11 min-w-0 flex-1 rounded-lg px-1 py-1 text-left"
                  >
                    <span className="block truncate text-sm">
                      <Highlight text={item.title} query={query} />
                      {item.isDemo ? (
                        <span className="ml-1 text-[10px] text-muted">(demo)</span>
                      ) : null}
                    </span>
                    <span className="block text-[11px] text-muted">{formatChatTime(item.updatedAt)}</span>
                  </button>
                  <div className="flex opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                    <IconButton label="Sevimlilarga" onClick={() => onFavorite(item.id)}>
                      <Star size={13} className={item.favorite ? "fill-accent text-accent" : undefined} />
                    </IconButton>
                    <IconButton label="Nomini o'zgartirish" onClick={() => onRename(item.id)}>
                      <Pencil size={13} />
                    </IconButton>
                    {onShare ? (
                      <IconButton label="Ulashish" onClick={() => onShare(item.id)}>
                        <Share2 size={13} />
                      </IconButton>
                    ) : null}
                    {onExport ? (
                      <IconButton label="Eksport" onClick={() => onExport(item.id)}>
                        <Download size={13} />
                      </IconButton>
                    ) : null}
                    <IconButton label="O'chirish" onClick={() => onDelete(item.id)}>
                      <Trash2 size={13} />
                    </IconButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-background hover:text-foreground"
    >
      {children}
    </button>
  );
}
