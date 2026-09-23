"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { USER_ERRORS } from "@/lib/ai/error-copy";

export function ConfigErrorNotice({
  onRetry,
}: {
  onRetry?: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);

  async function checkConfig() {
    setChecking(true);
    try {
      const response = await fetch("/api/ai/status");
      const json = (await response.json()) as { openaiConfigured?: boolean };
      setConfigured(json.openaiConfigured === true);
    } catch {
      setConfigured(false);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-center text-sm leading-6 text-amber-100/90">
      <p className="font-medium">{USER_ERRORS.missingKey}</p>
      <p className="mt-1 text-amber-100/80">{USER_ERRORS.missingKeyDetail}</p>
      {configured === true ? (
        <p className="mt-2 text-xs text-emerald-200">Kalit topildi. Qayta urinib ko&apos;ring.</p>
      ) : configured === false ? (
        <p className="mt-2 text-xs">{USER_ERRORS.missingKeyDetail}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => void checkConfig()} disabled={checking}>
          {checking ? "Tekshirilmoqda..." : "Konfiguratsiyani tekshirish"}
        </Button>
        {onRetry ? (
          <Button type="button" size="sm" onClick={onRetry}>
            Qayta urinish
          </Button>
        ) : null}
      </div>
    </div>
  );
}
