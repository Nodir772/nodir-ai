import type { ReactNode } from "react";
import { MarketingShell } from "@/components/layout/MarketingShell";

export function PlaceholderPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <MarketingShell>
      <section className="page-enter mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Nodir AI
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-4 text-base leading-7 text-muted">{description}</p>
        {children}
      </section>
    </MarketingShell>
  );
}
