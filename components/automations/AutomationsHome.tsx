"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceFrame } from "@/components/workspace/WorkspaceFrame";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/loaders";
import { ErrorState } from "@/components/ui/ErrorState";
import { useToast } from "@/components/ui/toast-context";

type Row = {
  id: string;
  name: string;
  enabled: boolean;
  scheduleEnabled: boolean;
  scheduleType: string;
  lastStatus: string | null;
};

export function AutomationsHome() {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetch("/api/automations")
      .then(async (response) => {
        const json = (await response.json()) as { automations?: Row[]; notice?: string; error?: string };
        if (!response.ok) throw new Error(json.error);
        setRows(json.automations ?? []);
        setNotice(json.notice ?? null);
        setError(null);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Yuklashda xatolik yuz berdi.");
        setRows([]);
      });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <WorkspaceFrame title="Avtomatlashtirish" subtitle="So'rov orqali ishga tushirish">
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <div className="flex justify-end">
          <Link href="/automations/create">
            <Button size="sm">Yangi</Button>
          </Link>
        </div>
        {notice ? <p className="text-xs text-muted">{notice}</p> : null}
        {rows === null ? <CardSkeleton /> : null}
        {error ? <ErrorState error={error} onRetry={load} /> : null}
        {rows && !error && rows.length === 0 ? (
          <EmptyState title="Hali avtomatlashtirish yo'q" description="Agent va matn bilan qoidani yarating." />
        ) : null}
        <ul className="space-y-2">
          {(rows ?? []).map((item) => (
            <li key={item.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.scheduleType} · {item.enabled ? "yoqilgan" : "o'chirilgan"}
                    {item.lastStatus ? ` · oxirgi: ${item.lastStatus}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      void fetch(`/api/automations/${item.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ enabled: !item.enabled }),
                      }).then(load);
                    }}
                  >
                    {item.enabled ? "O'chirish" : "Yoqish"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      void fetch(`/api/automations/${item.id}/run`, { method: "POST" }).then(async (response) => {
                        const json = (await response.json()) as { task?: { id: string }; error?: string };
                        if (!response.ok) toast(json.error ?? "Ishga tushmadi", "error");
                        else if (json.task) router.push(`/tasks/${json.task.id}`);
                      });
                    }}
                  >
                    Hozir ishga tushirish
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </WorkspaceFrame>
  );
}
