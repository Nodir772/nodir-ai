"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronUp, CreditCard, LayoutDashboard, LogOut, Moon, Settings, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { AVATAR_SRC } from "@/lib/constants";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { useTheme } from "next-themes";
import { useChat } from "@/components/chat/ChatProvider";

export function ProfileMenu({ onSettings }: { onSettings: () => void }) {
  const { user, logout } = useAuth();
  const { persistTheme } = useChat();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    function close() {
      setOpen(false);
    }
    if (open) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center gap-3 rounded-2xl border border-border bg-card p-2.5 text-left"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar src={user?.avatarUrl ?? AVATAR_SRC} alt={user?.name ?? "Nodir"} size={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{user?.name ?? "Nodir"}</span>
          {user?.email ? <span className="block truncate text-[11px] text-muted">{user.email}</span> : null}
          <span className="mt-1 block">
            <PlanBadge plan={user?.plan ?? "free"} />
          </span>
        </span>
        <ChevronUp size={16} className="text-muted" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 rounded-2xl border border-border bg-card p-1 shadow-2xl"
        >
          <Link
            href="/settings"
            role="menuitem"
            className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface-2"
            onClick={() => setOpen(false)}
          >
            <User size={15} /> Profil
          </Link>
          <Link
            href="/settings/usage"
            role="menuitem"
            className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface-2"
            onClick={() => setOpen(false)}
          >
            Foydalanish
          </Link>
          <Link
            href="/settings/billing"
            role="menuitem"
            className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface-2"
            onClick={() => setOpen(false)}
          >
            <CreditCard size={15} /> To&apos;lov
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface-2"
            onClick={() => {
              setOpen(false);
              onSettings();
            }}
          >
            <Settings size={15} /> Sozlamalar
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface-2"
            onClick={() => {
              void persistTheme(resolvedTheme === "dark" ? "light" : "dark");
              setOpen(false);
            }}
          >
            <Moon size={15} /> Mavzu
          </button>
          {isAdmin ? (
            <Link
              href="/admin"
              role="menuitem"
              className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface-2"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard size={15} /> Admin
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-300 hover:bg-surface-2"
            onClick={async () => {
              await logout();
              router.push("/login");
              router.refresh();
            }}
          >
            <LogOut size={15} /> Chiqish
          </button>
        </div>
      ) : null}
    </div>
  );
}
