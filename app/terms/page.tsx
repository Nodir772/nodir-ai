import type { Metadata } from "next";
import { MarketingShell } from "@/components/layout/MarketingShell";

export const metadata: Metadata = {
  title: "Foydalanish shartlari",
  description: "Nodir AI foydalanish shartlari — shablon matn, yuridik maslahat emas.",
};

export default function TermsPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-4xl font-semibold">Foydalanish shartlari</h1>
        <p className="mt-3 text-sm text-muted">
          Bu sahifa umumiy shablon. Sertifikatlar yoki qonuniy muvofiqlik da&apos;vo qilinmaydi.
        </p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-muted">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Xizmat</h2>
            <p className="mt-2">
              Nodir AI chat, vositalar, agentlar va tariflarga asoslangan AI yordamchisini taqdim etadi.
              Javoblar xato bo&apos;lishi mumkin — muhim qarorlarni tekshiring.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Hisob</h2>
            <p className="mt-2">
              Siz hisob xavfsizligi va qonuniy foydalanish uchun javobgarsiz. Zararli kod bajarish, boshqa
              foydalanuvchilar ma&apos;lumotiga kirish yoki tizimni buzish taqiqlanadi.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">To&apos;lov</h2>
            <p className="mt-2">
              Pullik tariflar Stripe orqali. To&apos;lov sozlanmagan bo&apos;lsa, muvaffaqiyatli to&apos;lov
              ko&apos;rsatilmaydi.
            </p>
          </section>
        </div>
      </article>
    </MarketingShell>
  );
}
