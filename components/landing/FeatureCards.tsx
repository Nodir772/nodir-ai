import {
  BookOpen,
  Code2,
  FileText,
  Languages,
  MessageSquare,
  PenLine,
} from "lucide-react";
import { FEATURE_CARDS } from "@/lib/constants";
import { Container } from "@/components/ui/Container";

const icons = [MessageSquare, PenLine, Code2, Languages, BookOpen, FileText];

export function FeatureCards() {
  return (
    <section id="xususiyatlar" className="scroll-mt-24 py-8 sm:py-14">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Imkoniyatlar
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Bitta suhbat. Ko&apos;p vazifa.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_CARDS.map((card, index) => {
            const Icon = icons[index] ?? MessageSquare;
            return (
              <article
                key={card.id}
                className="group rounded-3xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-[0_20px_50px_-32px_rgba(79,124,255,0.7)]"
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(79,124,255,0.18),rgba(139,92,246,0.18))] text-accent">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
