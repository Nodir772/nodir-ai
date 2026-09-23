import { FAQS } from "@/lib/constants";
import { Container } from "@/components/ui/Container";

export function FaqSection() {
  return (
    <section id="savollar" className="scroll-mt-24 py-8 sm:py-14">
      <Container className="max-w-3xl">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
          Tez-tez so&apos;raladigan savollar
        </h2>
        <div className="mt-8 space-y-3">
          {FAQS.map((item) => (
            <details
              key={item.question}
              className="group rounded-3xl border border-border bg-card px-5 py-4"
            >
              <summary className="cursor-pointer list-none font-medium marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span className="text-muted transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
