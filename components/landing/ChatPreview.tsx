import Image from "next/image";
import { AVATAR_SRC } from "@/lib/constants";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/brand/Logo";

export function ChatPreview() {
  return (
    <section className="py-8 sm:py-16">
      <Container>
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Interfeys
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Nodir AI chat muhiti
          </h2>
          <p className="mt-3 text-sm text-muted">
            Chiziqli, qorong&apos;u muhit — suhbat, vositalar va tariflar bitta joyda.
          </p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-border bg-secondary shadow-[0_40px_120px_-50px_rgba(79,124,255,0.55)]">
          <div className="grid min-h-[34rem] lg:grid-cols-[16.5rem_1fr]">
            <aside className="hidden border-r border-border bg-background/70 p-4 lg:flex lg:flex-col">
              <Logo size="sm" />
              <div className="mt-5 rounded-2xl bg-[linear-gradient(135deg,#4f7cff_0%,#8b5cf6_100%)] px-4 py-2.5 text-center text-sm font-medium text-white">
                Yangi suhbat
              </div>
              <nav className="mt-5 space-y-1 text-sm text-muted">
                {["Chat", "Tarjima", "Matn yozish", "Kod yozish", "Rasm yaratish", "Hujjat tahlili"].map(
                  (item) => (
                    <div key={item} className="rounded-xl px-3 py-2 hover:bg-surface-2 hover:text-foreground">
                      {item}
                    </div>
                  ),
                )}
              </nav>
              <div className="mt-4 border-t border-border pt-4">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  Chat tarixi
                </p>
                <div className="mt-2 space-y-1 text-sm text-muted">
                  <div className="rounded-xl bg-surface-2 px-3 py-2 text-foreground">Portfolio matni</div>
                  <div className="rounded-xl px-3 py-2">Python darsi</div>
                </div>
              </div>
              <div className="mt-auto flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5">
                <Image
                  src={AVATAR_SRC}
                  alt="Nodir"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium">Nodir</p>
                  <p className="text-xs text-muted">Hisob</p>
                </div>
              </div>
            </aside>

            <div className="flex flex-col bg-background">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <p className="text-sm font-medium">Yangi suhbat</p>
                <p className="text-xs text-muted">Nodir AI · Balanced</p>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                <Logo showWordmark={false} size="lg" />
                <h3 className="mt-5 font-display text-2xl font-semibold">Salom, Nodir! 👋</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                  Men Nodir AI, sizning shaxsiy sun&apos;iy intellekt yordamchingizman.
                  Sizga qanday yordam bera olaman?
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {["Menga kod yozib bering", "Ingliz tilidan tarjima qiling", "Matn yozishda yordam bering"].map(
                    (label) => (
                      <span
                        key={label}
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted"
                      >
                        {label}
                      </span>
                    ),
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 rounded-3xl border border-border bg-card px-4 py-3 text-sm text-muted">
                  <span className="flex-1">Xabar yozing...</span>
                  <span className="rounded-full bg-[linear-gradient(135deg,#4f7cff_0%,#8b5cf6_100%)] px-4 py-1.5 text-xs font-medium text-white">
                    Yuborish
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
