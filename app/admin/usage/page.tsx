"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type Row = { user_id: string; tool: string; created_at: string };

export default function AdminUsagePage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    void fetch("/api/admin/usage")
      .then((response) => response.json())
      .then((json: { usage?: Row[] }) => setRows(json.usage ?? []))
      .catch(() => undefined);
  }, []);

  return (
    <AdminShell title="Foydalanish">
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-[560px] w-full text-left text-sm">
          <thead className="bg-surface-2/50 text-muted">
            <tr>
              <th className="px-3 py-2">Foydalanuvchi</th>
              <th className="px-3 py-2">Funksiya</th>
              <th className="px-3 py-2">Vaqt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.user_id}-${row.created_at}-${index}`} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{row.user_id.slice(0, 8)}…</td>
                <td className="px-3 py-2">{row.tool}</td>
                <td className="px-3 py-2 text-muted">{new Date(row.created_at).toLocaleString("uz-UZ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
