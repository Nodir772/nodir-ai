"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  if (pathname !== menuPath) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-[4.25rem]">
        <Link href="/" className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Asosiy navigatsiya">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active && link.href === "/"
                    ? "text-foreground"
                    : "text-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-foreground"
          >
            Kirish
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center rounded-full bg-[linear-gradient(135deg,#4f7cff_0%,#6d5efc_50%,#8b5cf6_100%)] px-4 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgba(99,102,241,0.9)] transition hover:brightness-110"
          >
            Ro&apos;yxatdan o&apos;tish
          </Link>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Menyuni yopish" : "Menyuni ochish"}
            onClick={() => setOpen((value) => !value)}
            className="rounded-2xl"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </Container>

      <div
        id="mobile-nav"
        className={cn(
          "lg:hidden overflow-hidden border-t border-border/70 bg-background/95 backdrop-blur-xl transition-[max-height,opacity] duration-300",
          open ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <Container className="flex flex-col gap-1 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl px-3 py-3 text-sm font-medium text-foreground hover:bg-surface-2"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-full ring-1 ring-border text-sm font-medium"
            >
              Kirish
            </Link>
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4f7cff_0%,#8b5cf6_100%)] text-sm font-medium text-white"
            >
              Ro&apos;yxatdan o&apos;tish
            </Link>
          </div>
        </Container>
      </div>
    </header>
  );
}
