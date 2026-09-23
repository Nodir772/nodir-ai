"use client";

import type { ReactNode } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { useToast } from "@/components/ui/toast-context";

export function ToolOutput({
  text,
  loading,
  error,
  empty,
  onRetry,
  extra,
}: {
  text: string;
  loading: boolean;
  error: string | null;
  empty?: string;
  onRetry?: () => void;
  extra?: ReactNode;
}) {
  const { toast } = useToast();

  return (
    <section className="rounded-[1.6rem] border border-border bg-card/80 p-4 shadow-lg">
      {loading && !text ? (
        <div className="space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-surface-2" />
        </div>
      ) : error ? (
        <div className="space-y-3 text-sm">
          <p>{error}</p>
          {onRetry ? (
            <Button variant="outline" onClick={onRetry}>
              Qayta urinib ko&apos;ring
            </Button>
          ) : null}
        </div>
      ) : text ? (
        <div>
          <ChatMarkdown content={text} streaming={loading} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(text);
                toast("Nusxa olindi", "success");
              }}
            >
              <Copy size={14} /> Nusxa
            </Button>
            {extra}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">{empty ?? "Natija shu yerda ko'rinadi."}</p>
      )}
    </section>
  );
}
