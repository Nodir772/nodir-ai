"use client";

import { Button } from "@/components/ui/Button";
import { friendlyError } from "@/lib/ui/errors";
import { cn } from "@/lib/utils";

export function RetryButton({
  onClick,
  disabled,
  label = "Qayta urinish",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Button type="button" onClick={onClick} disabled={disabled}>
      {label}
    </Button>
  );
}

export function ErrorState({
  title = "Xatolik yuz berdi",
  error,
  onRetry,
  className,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("grid place-items-center px-4 py-12 text-center", className)} role="alert">
      <div className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Xatolik</p>
        <h2 className="mt-3 font-display text-2xl font-semibold">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{friendlyError(error)}</p>
        {onRetry ? (
          <div className="mt-6">
            <RetryButton onClick={onRetry} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
