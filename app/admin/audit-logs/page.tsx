"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type Log = {
  id: string;
  admin_user_id: string | null;
  action: string;
  target_user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    void fetch("/api/admin/audit")
      .then((response) => response.json())
      .then((json: { logs?: Log[] }) => setLogs(json.logs ?? []))
      .catch(() => undefined);
  }, []);

  return (
    <AdminShell title="Audit jurnali">
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-[640px] w-full text-left text-sm">
          <thead className="bg-surface-2/50 text-muted">
            <tr>
              <th className="px-3 py-2">Vaqt</th>
              <th className="px-3 py-2">Amal</th>
              <th className="px-3 py-2">Maqsad</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-border">
                <td className="px-3 py-2 text-muted">{new Date(log.created_at).toLocaleString("uz-UZ")}</td>
                <td className="px-3 py-2">{log.action}</td>
                <td className="px-3 py-2 font-mono text-xs">{log.target_user_id?.slice(0, 8) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
