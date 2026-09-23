"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-context";

type Flag = { key: string; enabled: boolean };

export default function AdminSystemPage() {
  const { toast } = useToast();
  const [system, setSystem] = useState<Record<string, boolean>>({});
  const [flags, setFlags] = useState<Flag[]>([]);

  function load() {
    void fetch("/api/admin/system")
      .then((response) => response.json())
      .then((json: { system?: Record<string, boolean>; flags?: Flag[] }) => {
        setSystem(json.system ?? {});
        setFlags(json.flags ?? []);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(flag: Flag) {
    const response = await fetch("/api/admin/flags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: flag.key, enabled: !flag.enabled }),
    });
    if (!response.ok) {
      toast("Flag yangilanmadi.", "error");
      return;
    }
    toast("Feature flag yangilandi.", "success");
    load();
  }

  return (
    <AdminShell title="Tizim">
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(system).map(([key, value]) => (
          <article key={key} className="rounded-2xl border border-border p-4 text-sm">
            <p className="text-muted">{key}</p>
            <p className="mt-1">{value ? "Yoqilgan" : "O'chiq"}</p>
          </article>
        ))}
      </div>
      <h2 className="mt-8 font-display text-xl">Feature flags</h2>
      <ul className="mt-3 space-y-2">
        {flags.map((flag) => (
          <li key={flag.key} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
            <span>{flag.key}</span>
            <Button variant="ghost" onClick={() => void toggle(flag)}>
              {flag.enabled ? "O'chirish" : "Yoqish"}
            </Button>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
