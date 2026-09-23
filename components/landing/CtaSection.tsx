import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function CtaSection() {
  return (
    <section className="pb-20 pt-6">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,124,255,0.18),transparent_55%)]" />
          <div className="relative">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Bugun o&apos;zingiz uchun yangi imkoniyatlarni oching!
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted">
              Nodir AI bilan yozing, o&apos;rganing va yaratishni tezlashtiring.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex h-12 items-center rounded-full bg-[linear-gradient(135deg,#4f7cff_0%,#8b5cf6_100%)] px-8 text-sm font-medium text-white shadow-[0_16px_40px_-18px_rgba(99,102,241,1)] transition hover:brightness-110"
            >
              Boshlash
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
