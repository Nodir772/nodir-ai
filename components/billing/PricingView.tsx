"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PLAN_LIST, isPaidPlan, type PlanId, yearlySavingsMonths } from "@/lib/billing/plans";
import { useBilling } from "@/components/billing/useBilling";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { useToast } from "@/components/ui/toast-context";
import { formatBytes } from "@/lib/files/validate";

const FAQS = [
  {
    q: "To'lov qanday ishlaydi?",
    a: "Stripe TEST MODE orqali obuna ochiladi. Haqiqiy to'lov faqat biznes egasi Stripe hisobini sozlagandan keyin yoqiladi.",
  },
  {
    q: "Obunani bekor qilish mumkinmi?",
    a: "Ha. Stripe sozlangan bo'lsa, Billing portal orqali davr oxirida bekor qilish mumkin.",
  },
  {
    q: "Limitlar qachon yangilanadi?",
    a: "Limitlar oylik billing davri bo'yicha hisoblanadi. Reset sanasi Foydalanish sahifasida ko'rinadi.",
  },
  {
    q: "To'lov muvaffaqiyatsiz bo'lsa?",
    a: "Webhook to'lov xatosini qayd etadi. Muvaffaqiyat brauzerdan ishonilmaydi.",
  },
];

function capLabel(value: number) {
  return value <= 0 ? "Cheksiz" : value.toLocaleString("uz-UZ");
}

export function PricingView() {
  const { data } = useBilling();
  const { toast } = useToast();
  const [yearly, setYearly] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const current = (data?.plan ?? "free") as PlanId;

  async function checkout(plan: PlanId) {
    if (!isPaidPlan(plan)) return;
    setPending(plan);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval: yearly ? "year" : "month" }),
      });
      const json = (await response.json()) as { url?: string; error?: string; code?: string };
      if (json.url) {
        window.location.assign(json.url);
        return;
      }
      toast(json.error ?? "To'lovni boshlab bo'lmadi.", "error");
    } catch {
      toast("Tarmoq xatosi.", "error");
    } finally {
      setPending(null);
    }
  }

  async function portal() {
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const json = (await response.json()) as { url?: string; error?: string };
    if (json.url) window.location.assign(json.url);
    else toast(json.error ?? "Portal ochilmadi.", "error");
  }

  const rows: [string, (plan: (typeof PLAN_LIST)[number]) => string][] = [
    ["Oylik AI xabarlar", (p) => capLabel(p.aiMessages)],
    ["Rasmlar", (p) => capLabel(p.imageGenerations)],
    ["Hujjat tahlili", (p) => capLabel(p.documentAnalyses)],
    ["Veb-qidiruv", (p) => capLabel(p.webSearches)],
    ["Ovoz (daqiqa)", (p) => capLabel(p.voiceMinutes)],
    ["Modellar", (p) => p.allowedModels.map((id) => (id === "nodir-fast" ? "Fast" : id === "nodir-balanced" ? "Balanced" : "Advanced")).join(", ")],
    ["Kod yordamchisi", (p) => (p.features.code ? "Bor" : "Yo'q")],
    ["Fayl hajmi", (p) => formatBytes(p.fileSizeLimit)],
    ["So'rov / daqiqa", (p) => String(p.rateLimit)],
    ["Kontekst", (p) => p.contextLevel],
  ];

  return (
    <section className="page-enter mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Narxlar</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">O&apos;zingizga mos reja</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          {data?.stripeConfigured
            ? "Stripe TEST MODE. Obuna holati faqat server webhook orqali tasdiqlanadi."
            : "To'lov xizmati hali sozlanmagan. Stripe kalitlari qo'shilmaguncha to'lov muvaffaqiyatli deb ko'rsatilmaydi."}
        </p>
        {data ? (
          <p className="mt-3 text-sm">
            Joriy reja: <PlanBadge plan={current} />
          </p>
        ) : null}
        <div className="mt-6 inline-flex rounded-full border border-border bg-card p-1 text-sm">
          <button
            type="button"
            className={`rounded-full px-4 py-1.5 ${!yearly ? "bg-surface-2 text-foreground" : "text-muted"}`}
            onClick={() => setYearly(false)}
          >
            Oylik
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-1.5 ${yearly ? "bg-surface-2 text-foreground" : "text-muted"}`}
            onClick={() => setYearly(true)}
          >
            Yillik
          </button>
        </div>
        {yearly ? <p className="mt-3 text-xs text-accent">Yillik to&apos;lovda 2 oy tejaysiz</p> : null}
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {PLAN_LIST.map((plan) => {
          const featured = plan.popular;
          const price = yearly ? plan.yearlyPrice : plan.price;
          const isCurrent = current === plan.id;
          const saved = yearly ? yearlySavingsMonths(plan) : 0;
          return (
            <article
              key={plan.id}
              className={`relative rounded-[1.75rem] border p-7 ${
                featured
                  ? "border-accent/50 bg-card shadow-[0_24px_80px_-40px_rgba(79,124,255,0.8)]"
                  : "border-border bg-card/80"
              }`}
            >
              {plan.badge ? (
                <span className="absolute -top-3 left-6 rounded-full border border-accent/40 bg-accent/15 px-3 py-0.5 text-[11px] font-medium text-accent">
                  {plan.badge}
                </span>
              ) : null}
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl font-semibold">{plan.name}</h2>
                {isCurrent ? <PlanBadge plan={plan.id} /> : null}
              </div>
              <p className="mt-2 text-sm text-muted">{plan.description}</p>
              <p className="mt-6 font-display text-4xl font-semibold">
                ${price}
                <span className="text-base font-medium text-muted">{yearly ? " / yil" : " / oy"}</span>
              </p>
              {yearly && saved > 0 ? <p className="mt-1 text-xs text-accent">{saved} oy tejang</p> : null}
              <ul className="mt-6 space-y-2 text-sm text-muted">
                {plan.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {plan.limits.length ? (
                <ul className="mt-4 space-y-1 text-xs text-muted/80">
                  {plan.limits.map((item) => (
                    <li key={item}>Cheklov: {item}</li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-8">
                {isCurrent ? (
                  plan.id === "free" ? (
                    <Button className="w-full" disabled>
                      Joriy reja
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => void portal()}>
                      Obunani boshqarish
                    </Button>
                  )
                ) : plan.id === "free" ? (
                  <Link href="/register" className="block">
                    <Button variant="ghost" className="w-full">
                      Boshlash
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full" disabled={pending === plan.id} onClick={() => void checkout(plan.id)}>
                    {pending === plan.id ? "Ochilmoqda..." : "Yangilash"}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-16 overflow-x-auto rounded-[1.5rem] border border-border">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="bg-surface-2/60 text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Imkoniyat</th>
              {PLAN_LIST.map((plan) => (
                <th key={plan.id} className="px-4 py-3 font-medium">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-t border-border">
                <td className="px-4 py-3 text-muted">{label}</td>
                {PLAN_LIST.map((plan) => (
                  <td key={`${label}-${plan.id}`} className="px-4 py-3">
                    {value(plan)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-16 grid gap-4 md:grid-cols-2">
        {FAQS.map((item) => (
          <article key={item.q} className="rounded-2xl border border-border bg-card/70 p-5">
            <h3 className="font-medium">{item.q}</h3>
            <p className="mt-2 text-sm text-muted">{item.a}</p>
          </article>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        Yordam kerakmi?{" "}
        <Link href="/support" className="text-accent">
          Support
        </Link>
      </p>
    </section>
  );
}
