"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getPlan, recommendedUpgrade, type PlanId } from "@/lib/billing/plans";
import { PlanBadge } from "@/components/billing/PlanBadge";

type UpgradeDetail = {
  title?: string;
  error?: string;
  currentPlan?: PlanId | string;
  requiredPlan?: PlanId | string;
  feature?: string;
};

export function openUpgradeModal(detail: UpgradeDetail) {
  window.dispatchEvent(new CustomEvent("nodir-upgrade", { detail }));
}

export function handleBillingResponse(json: {
  code?: string;
  title?: string;
  error?: string;
  currentPlan?: PlanId | string;
  requiredPlan?: PlanId | string;
  feature?: string;
  used?: number;
  limit?: number;
  remaining?: number;
  resetAt?: string;
  recommendedPlan?: PlanId | string | null;
  recommendedName?: string | null;
  recommendedPrice?: number | null;
  waitCta?: string;
}) {
  if (json.code === "USAGE_LIMIT") {
    window.dispatchEvent(new CustomEvent("nodir-limit", { detail: json }));
    return true;
  }
  if (json.code === "PLAN_REQUIRED" || json.code === "FEATURE_DISABLED") {
    openUpgradeModal(json);
    return true;
  }
  return false;
}

export function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<UpgradeDetail>({});

  useEffect(() => {
    function onUpgrade(event: Event) {
      const custom = event as CustomEvent<UpgradeDetail>;
      setDetail(custom.detail ?? {});
      setOpen(true);
    }
    window.addEventListener("nodir-upgrade", onUpgrade);
    return () => window.removeEventListener("nodir-upgrade", onUpgrade);
  }, []);

  const current = getPlan(detail.currentPlan);
  const required = getPlan(detail.requiredPlan ?? recommendedUpgrade(detail.currentPlan)?.plan ?? "pro");
  const next = recommendedUpgrade(detail.currentPlan);

  return (
    <Modal open={open} title={detail.title ?? "Tarifni yangilash kerak"} onClose={() => setOpen(false)} className="max-w-md">
      <p className="text-sm text-muted">{detail.error ?? "Bu imkoniyat joriy tarifda yo'q."}</p>
      {detail.feature ? <p className="mt-2 text-sm">Funksiya: {detail.feature}</p> : null}
      <p className="mt-3 flex items-center gap-2 text-sm">
        Joriy reja: <PlanBadge plan={current.id} />
      </p>
      {next ? (
        <p className="mt-2 text-sm">
          Tavsiya: {required.name} — ${required.price}/oy
        </p>
      ) : (
        <p className="mt-2 text-sm">Sizda eng yuqori reja bor.</p>
      )}
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
        {required.bullets.slice(0, 4).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Yopish
        </Button>
        {next ? (
          <Link href="/pricing" onClick={() => setOpen(false)}>
            <Button>Tariflarni ko&apos;rish</Button>
          </Link>
        ) : (
          <Link href="/settings/usage" onClick={() => setOpen(false)}>
            <Button>Foydalanish</Button>
          </Link>
        )}
      </div>
    </Modal>
  );
}
