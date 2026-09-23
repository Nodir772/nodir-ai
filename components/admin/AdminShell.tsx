"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Umumiy" },
  { href: "/admin/users", label: "Foydalanuvchilar" },
  { href: "/admin/subscriptions", label: "Obunalar" },
  { href: "/admin/usage", label: "Foydalanish" },
  { href: "/admin/system", label: "Tizim" },
  { href: "/admin/audit-logs", label: "Audit" },
  { href: "/admin/support", label: "Support" },
];

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/admin/overview").then(async (response) => {
      if (response.status === 401) {
        router.replace("/login?next=/admin");
        return;
      }
      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Admin huquqi yo'q.");
        setAllowed(false);
        return;
      }
      setAllowed(true);
    });
  }, [router]);

  if (allowed === null) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background text-sm text-muted">Yuklanmoqda...</main>
    );
  }
  if (!allowed) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-4 text-center">
        <div>
          <p className="font-display text-2xl">Ruxsat yo&apos;q</p>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <Link href="/chat" className="mt-4 inline-block text-sm text-accent">
            Chatga qaytish
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Logo size="sm" />
          <Link href="/chat" className="text-sm text-muted hover:text-foreground">
            Chatga qaytish
          </Link>
        </div>
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Admin">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                pathname === link.href ? "border-accent/50 bg-accent/10 text-foreground" : "border-border text-muted",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <h1 className="mt-8 font-display text-3xl font-semibold">{title}</h1>
        <div className="mt-5">{children}</div>
      </div>
    </main>
  );
}
