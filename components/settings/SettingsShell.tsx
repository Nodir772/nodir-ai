"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { useAuth } from "@/components/auth/AuthProvider";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { useI18n } from "@/components/i18n/LocaleProvider";

const LINKS = [
  { href: "/settings", key: "settings.profile" as const, fallback: "Umumiy" },
  { href: "/settings/profile", key: "settings.profile" as const, fallback: "Profil" },
  { href: "/settings/appearance", key: "settings.appearance" as const, fallback: "Ko'rinish" },
  { href: "/settings/memory", key: "settings.memory" as const, fallback: "Xotira" },
  { href: "/settings/privacy", key: "settings.privacy" as const, fallback: "Maxfiylik" },
  { href: "/settings/security", key: "settings.security" as const, fallback: "Xavfsizlik" },
  { href: "/settings/notifications", key: "settings.notifications" as const, fallback: "Bildirishnomalar" },
  { href: "/settings/usage", key: "settings.usage" as const, fallback: "Foydalanish" },
  { href: "/settings/billing", key: "settings.billing" as const, fallback: "To'lov" },
];

export function SettingsShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <WorkspaceFrame title={title} subtitle={t("nav.settings")}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 lg:hidden">
          <Logo size="sm" />
          <PlanBadge plan={user?.plan ?? "free"} />
        </div>
        <nav className="flex flex-wrap gap-2" aria-label={t("nav.settings")}>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                pathname === link.href
                  ? "border-accent/50 bg-accent/10 text-foreground"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              {link.fallback}
            </Link>
          ))}
        </nav>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        <div className={cn("rounded-[1.6rem] border border-border bg-card/80 p-5 sm:p-6")}>{children}</div>
      </div>
    </WorkspaceFrame>
  );
}
