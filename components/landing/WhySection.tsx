import { Lock, Sparkles, Timer, Wand2 } from "lucide-react";
import { BENEFITS } from "@/lib/constants";
import { Container } from "@/components/ui/Container";

const icons = [Timer, Sparkles, Wand2, Lock];

export function WhySection() {
  return (
    <section className="py-10 sm:py-16">
      <Container>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          NEGA NODIR AI?
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Bitta platformada ko&apos;p imkoniyatlar
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((item, index) => {
            const Icon = icons[index] ?? Sparkles;
            return (
              <article
                key={item.title}
                className="rounded-3xl border border-border bg-card/80 p-6"
              >
                <Icon className="text-accent" size={22} />
                <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
