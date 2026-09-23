import type { Metadata } from "next";
import { MarketingShell } from "@/components/layout/MarketingShell";

export const metadata: Metadata = {
  title: "Maxfiylik siyosati",
  description: "Nodir AI maxfiylik siyosati — shablon matn, yuridik maslahat emas.",
};

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-4xl font-semibold">Maxfiylik siyosati</h1>
        <p className="mt-3 text-sm text-muted">
          Bu sahifa umumiy shablon. U yuridik maslahat yoki sertifikat da&apos;vosi emas. Yakuniy matnni
          huquqshunos bilan tasdiqlang.
        </p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-muted">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Qanday ma&apos;lumotlar</h2>
            <p className="mt-2">
              Hisob (email, ism), suhbatlar, sozlamalar, loyiha fayllari va foydalanish hisobi xizmatni
              ishlatish uchun saqlanishi mumkin. To&apos;lov ma&apos;lumotlari Stripe orqali qayta ishlanadi —
              kartalar serverimizda saqlanmaydi.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Qanday ishlatiladi</h2>
            <p className="mt-2">
              Ma&apos;lumotlar AI javoblari, tarif limitlari va hisobni boshqarish uchun ishlatiladi. API
              kalitlari brauzerga chiqmaydi.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Huquqlaringiz</h2>
            <p className="mt-2">
              Sozlamalardan ma&apos;lumot eksport qilishingiz va hisobni o&apos;chirishni so&apos;rashingiz mumkin.
            </p>
          </section>
        </div>
      </article>
    </MarketingShell>
  );
}
