"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { Button } from "@/components/ui/Button";
import { PlanBadge, UsageCard } from "@/components/billing/UsageCard";
import { useBilling } from "@/components/billing/useBilling";
import { useToast } from "@/components/ui/toast-context";
import { isHighestPlan, isPaidPlan, recommendedUpgrade, type PaidPlanId } from "@/lib/billing/plans";

export default function BillingSettingsPage() {
  const { data, loading } = useBilling();
  const { toast } = useToast();
  const next = data?.recommendedUpgrade ?? (data ? recommendedUpgrade(data.plan) : null);
  const upgradePlan = next && isPaidPlan(next.plan) ? next.plan : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast("Checkout yakunlandi. Obuna webhook tasdiqlagandan keyin yangilanadi.", "info");
    }
  }, [toast]);

  async function checkout(plan: PaidPlanId) {
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval: "month" }),
    });
    const json = (await response.json()) as { url?: string; error?: string };
    if (json.url) window.location.assign(json.url);
    else toast(json.error ?? "To'lov ochilmadi.", "error");
  }

  async function portal() {
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const json = (await response.json()) as { url?: string; error?: string };
    if (json.url) window.location.assign(json.url);
    else toast(json.error ?? "Portal ochilmadi.", "error");
  }

  const sub = data?.subscription;
  const end = sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("uz-UZ") : "—";
  const reset = data?.usage?.resetAt ? new Date(data.usage.resetAt).toLocaleDateString("uz-UZ") : null;

  return (
    <SettingsShell title="To'lov">
      {loading ? <p className="text-sm text-muted">Yuklanmoqda...</p> : null}
      {data ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <PlanBadge plan={data.plan} />
            <span className="text-sm text-muted">Holat: {sub?.status ?? "inactive"}</span>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-border p-4">
              <dt className="text-muted">Yangilanish sanasi</dt>
              <dd className="mt-1">{end}</dd>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <dt className="text-muted">Davr oxirida bekor</dt>
              <dd className="mt-1">{sub?.cancel_at_period_end ? "Ha" : "Yo'q"}</dd>
            </div>
          </dl>
          {!data.stripeConfigured ? (
            <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              Stripe TEST MODE sozlanmagan. To&apos;lov muvaffaqiyatli deb ko&apos;rsatilmaydi.
            </p>
          ) : null}
          {isHighestPlan(data.plan) ? (
            <p className="rounded-2xl border border-border bg-surface-2/50 p-4 text-sm">Sizda eng yuqori reja bor.</p>
          ) : next ? (
            <p className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm">
              Tavsiya: {next.name} — ${next.price}/oy
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {upgradePlan && next ? (
              <Button onClick={() => void checkout(upgradePlan)}>{next.name} — ${next.price}/oy</Button>
            ) : null}
            <Button variant="ghost" onClick={() => void portal()}>
              Obunani boshqarish
            </Button>
            <Link href="/pricing">
              <Button variant="ghost">Tariflar</Button>
            </Link>
            <Link href="/support">
              <Button variant="ghost">Yordam</Button>
            </Link>
          </div>
          {data.usage ? (
            <UsageCard
              label={reset ? `Oylik xabarlar · reset ${reset}` : "Oylik xabarlar"}
              used={data.usage.messages.used}
              limit={data.usage.messages.limit}
            />
          ) : null}
        </div>
      ) : null}
    </SettingsShell>
  );
}
