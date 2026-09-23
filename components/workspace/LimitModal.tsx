"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getPlan, recommendedUpgrade, type PlanId } from "@/lib/billing/plans";
import { LIMIT_COPY } from "@/lib/usage/config";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { openUpgradeModal } from "@/components/billing/UpgradeModal";

export type LimitDetail = {
  title?: string;
  error?: string;
  currentPlan?: PlanId | string;
  used?: number;
  limit?: number;
  remaining?: number;
  resetAt?: string;
  recommendedPlan?: PlanId | string | null;
  recommendedName?: string | null;
  recommendedPrice?: number | null;
  waitCta?: string;
};

export function openLimitModal(detail?: LimitDetail) {
  window.dispatchEvent(new CustomEvent("nodir-limit", { detail: detail ?? {} }));
}

export function LimitModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<LimitDetail>({});

  useEffect(() => {
    function onLimit(event: Event) {
      const custom = event as CustomEvent<LimitDetail>;
      setDetail(custom.detail ?? {});
      setOpen(true);
    }
    window.addEventListener("nodir-limit", onLimit);
    return () => window.removeEventListener("nodir-limit", onLimit);
  }, []);

  const planId = detail.currentPlan;
  const plan = getPlan(planId);
  const next = recommendedUpgrade(planId);
  const reset = detail.resetAt ? new Date(detail.resetAt).toLocaleDateString("uz-UZ") : null;
  const usedText =
    typeof detail.used === "number" && typeof detail.limit === "number"
      ? `${detail.used} / ${detail.limit}`
      : null;

  return (
    <Modal open={open} title={detail.title ?? LIMIT_COPY.title} onClose={() => setOpen(false)} className="max-w-md">
      <p className="text-sm leading-6 text-muted">{detail.error ?? LIMIT_COPY.body}</p>
      <div className="mt-4 rounded-2xl border border-border bg-surface-2/50 p-4 text-sm">
        <p className="flex items-center gap-2">
          Joriy reja: <PlanBadge plan={plan.id} />
        </p>
        {usedText ? <p className="mt-2">Ishlatilgan: {usedText}</p> : null}
        {reset ? <p className="mt-1 text-muted">Reset: {reset}</p> : null}
      </div>
      {next ? (
        <p className="mt-4 text-sm">
          Tavsiya: <span className="font-medium">{next.name}</span> — ${next.price}/oy
        </p>
      ) : (
        <p className="mt-4 text-sm">{getPlan("pro_max").name} — sizda eng yuqori reja bor.</p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>
          {detail.waitCta ?? LIMIT_COPY.wait}
        </Button>
        {next ? (
          <Link href="/pricing" onClick={() => setOpen(false)}>
            <Button>{LIMIT_COPY.cta}</Button>
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

export function handleLimitResponse(json: {
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
    openLimitModal(json);
    return true;
  }
  if (json.code === "PLAN_REQUIRED" || json.code === "FEATURE_DISABLED") {
    openUpgradeModal(json);
    return true;
  }
  return false;
}
