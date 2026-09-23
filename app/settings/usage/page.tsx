"use client";

import Link from "next/link";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { Button } from "@/components/ui/Button";
import { PlanBadge, UsageCard } from "@/components/billing/UsageCard";
import { useBilling } from "@/components/billing/useBilling";
import { isHighestPlan, recommendedUpgrade } from "@/lib/billing/plans";

export default function UsagePage() {
  const { data, loading } = useBilling();
  const usage = data?.usage;
  const next = data?.recommendedUpgrade ?? (data ? recommendedUpgrade(data.plan) : null);
  const reset = usage?.resetAt ? new Date(usage.resetAt).toLocaleDateString("uz-UZ") : null;

  return (
    <SettingsShell title="Foydalanish">
      <p className="text-sm text-muted">
        Oylik foydalanish serverdagi hisobdan olinadi. Ichki API xarajatlari ko&apos;rsatilmaydi.
      </p>
      {loading ? <p className="mt-4 text-sm text-muted">Yuklanmoqda...</p> : null}
      {usage ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-2">
              Joriy reja: <PlanBadge plan={usage.plan} />
            </span>
            {reset ? <span className="text-muted">Reset: {reset}</span> : null}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <UsageCard label="AI xabarlar" used={usage.messages.used} limit={usage.messages.limit} />
            <UsageCard label="Rasmlar" used={usage.images.used} limit={usage.images.limit} />
            <UsageCard label="Hujjatlar" used={usage.documents.used} limit={usage.documents.limit} />
            <UsageCard label="Veb-qidiruv" used={usage.searches.used} limit={usage.searches.limit} />
            <UsageCard label="Ovoz" used={usage.voice.used} limit={usage.voice.limit} unit="daq" />
          </div>
          {isHighestPlan(data?.plan) ? (
            <p className="mt-5 rounded-2xl border border-border bg-surface-2/50 p-4 text-sm">Sizda eng yuqori reja bor.</p>
          ) : next ? (
            <p className="mt-5 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm">
              Keyingi tarif: {next.name} — ${next.price}/oy
            </p>
          ) : null}
        </>
      ) : null}
      {isHighestPlan(data?.plan) ? null : (
        <Link href="/pricing">
          <Button className="mt-6">Tariflarni ko&apos;rish</Button>
        </Link>
      )}
    </SettingsShell>
  );
}
