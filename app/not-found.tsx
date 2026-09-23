import Link from "next/link";
import { MarketingShell } from "@/components/layout/MarketingShell";

export default function NotFound() {
  return (
    <MarketingShell>
      <section className="page-enter mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          404
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold">Sahifa topilmadi</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Bu manzil mavjud emas yoki ko&apos;chirilgan.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center rounded-full bg-[linear-gradient(135deg,#4f7cff_0%,#8b5cf6_100%)] px-6 text-sm font-medium text-white"
        >
          Bosh sahifaga qaytish
        </Link>
      </section>
    </MarketingShell>
  );
}
