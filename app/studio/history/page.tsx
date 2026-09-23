"use client";

import { useEffect, useState } from "react";
import { StudioShell } from "@/components/studio/StudioShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

const FILTERS = ["", "image", "writing", "code", "research", "document", "translation", "summary"] as const;

export default function StudioHistoryPage() {
  const [type, setType] = useState("");
  const [items, setItems] = useState<{ id: string; type: string; title: string; created_at: string }[]>([]);

  useEffect(() => {
    const q = type ? `?type=${type}` : "";
    void fetch(`/api/studio/items${q}`)
      .then((response) => response.json())
      .then((json: { items?: typeof items }) => setItems(json.items ?? []))
      .catch(() => undefined);
  }, [type]);

  return (
    <StudioShell title="Studio tarixi">
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <Button key={item || "all"} size="sm" variant={type === item ? "primary" : "outline"} onClick={() => setType(item)}>
              {item || "Barchasi"}
            </Button>
          ))}
        </div>
        {items.length === 0 ? (
          <EmptyState title="Hali studio ishi yo'q" description="Yozish, kod yoki tadqiqotni saqlang." />
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
                <span>
                  {item.title} · {item.type}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void fetch(`/api/studio/items?id=${item.id}`, { method: "DELETE" }).then(() => {
                      setItems((rows) => rows.filter((row) => row.id !== item.id));
                    });
                  }}
                >
                  O&apos;chirish
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </StudioShell>
  );
}
