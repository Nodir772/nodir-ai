"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="Xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
      className="min-h-dvh"
      onRetry={reset}
    />
  );
}
