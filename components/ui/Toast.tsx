"use client";

import { X } from "lucide-react";
import { useToast } from "@/components/ui/toast-context";
import { cn } from "@/lib/utils";

export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur-xl page-enter",
            item.tone === "error"
              ? "border-red-500/30 bg-red-950/70 text-red-100"
              : "border-border bg-card/90 text-foreground",
          )}
          role="status"
        >
          <p className="flex-1 leading-5">{item.message}</p>
          <button
            type="button"
            className="rounded-md text-muted hover:text-foreground"
            aria-label="Yopish"
            onClick={() => dismiss(item.id)}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
