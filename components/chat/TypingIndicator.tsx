"use client";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export function TypingIndicator({ onStop }: { onStop: () => void }) {
  return (
    <div className="flex items-start gap-3">
      <Logo showWordmark={false} size="sm" markClassName="h-9 w-9 rounded-xl text-xs" />
      <div className="rounded-[1.35rem] border border-border bg-card px-4 py-3">
        <p className="text-xs text-muted">Nodir AI</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="typing-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="text-sm text-muted">Javob tayyorlanmoqda...</span>
        </div>
        <Button variant="ghost" size="sm" className="mt-2 h-8 px-3" onClick={onStop}>
          To&apos;xtatish
        </Button>
      </div>
    </div>
  );
}
