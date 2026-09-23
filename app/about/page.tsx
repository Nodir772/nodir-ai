import type { Metadata } from "next";
import Image from "next/image";
import { AVATAR_SRC } from "@/lib/constants";
import { MarketingShell } from "@/components/layout/MarketingShell";

export const metadata: Metadata = {
  title: "Biz haqimizda",
  description: "Nodir AI — shaxsiy sun'iy intellekt yordamchisi. Chat, yozish, kod, tarjima va o'rganish bitta joyda.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="page-enter mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Biz haqimizda
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Nodir AI
        </h1>
        <p className="mt-5 text-base leading-7 text-muted">
          Nodir AI — shaxsiy sun&apos;iy intellekt yordamchisi. Maqsad: savol berish,
          yozish, kod, tarjima va o&apos;rganishni bitta sodda, premium interfeysda
          birlashtirish.
        </p>
        <div className="mt-10 flex items-center gap-4 rounded-3xl border border-border bg-card p-4">
          <Image
            src={AVATAR_SRC}
            alt="Nodir"
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-full object-cover"
          />
          <div>
            <p className="font-display text-lg font-semibold">Nodir</p>
            <p className="text-sm text-muted">Asoschi · Software engineer</p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
