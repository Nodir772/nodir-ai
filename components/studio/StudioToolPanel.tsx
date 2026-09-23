"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code2,
  FileText,
  ImageIcon,
  Languages,
  MessageSquare,
  Mic,
  PenLine,
  Search,
  TextQuote,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const STUDIO_NAV = [
  { href: "/studio", label: "Studio", match: (path: string) => path === "/studio" },
  { href: "/chat", label: "Chat", icon: MessageSquare, match: (path: string) => path.startsWith("/chat") },
  { href: "/studio/image", label: "Rasm", icon: ImageIcon, match: (path: string) => path.startsWith("/studio/image") },
  { href: "/studio/documents", label: "Hujjat", icon: FileText, match: (path: string) => path.startsWith("/studio/documents") },
  { href: "/studio/writing", label: "Yozish", icon: PenLine, match: (path: string) => path.startsWith("/studio/writing") },
  { href: "/studio/code", label: "Kod", icon: Code2, match: (path: string) => path.startsWith("/studio/code") },
  { href: "/studio/research", label: "Tadqiqot", icon: Search, match: (path: string) => path.startsWith("/studio/research") },
  { href: "/studio/translate", label: "Tarjima", icon: Languages, match: (path: string) => path.startsWith("/studio/translate") },
  { href: "/studio/summarize", label: "Xulosa", icon: TextQuote, match: (path: string) => path.startsWith("/studio/summarize") },
  { href: "/studio/voice", label: "Ovoz", icon: Mic, match: (path: string) => path.startsWith("/studio/voice") },
] as const;

export function StudioToolPanel() {
  const pathname = usePathname();
  return (
    <nav aria-label="Studio vositalari" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
      {STUDIO_NAV.map((item) => {
        const active = item.match(pathname);
        const Icon = "icon" in item ? item.icon : MessageSquare;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm",
              active ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <Icon size={16} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
