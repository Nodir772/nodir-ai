"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { PlanBadge } from "@/components/billing/UsageCard";
import { useToast } from "@/components/ui/toast-context";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  plan: string;
  role: string;
  is_suspended: boolean;
  last_seen_at: string | null;
  created_at: string;
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);

  function load() {
    void fetch("/api/admin/users")
      .then((response) => response.json())
      .then((json: { users?: UserRow[] }) => setUsers(json.users ?? []))
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(userId: string, body: Record<string, unknown>) {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...body }),
    });
    if (!response.ok) {
      toast("Yangilab bo'lmadi.", "error");
      return;
    }
    toast("Admin amali bajarildi.", "success");
    load();
  }

  return (
    <AdminShell title="Foydalanuvchilar">
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="bg-surface-2/50 text-muted">
            <tr>
              <th className="px-3 py-2">Foydalanuvchi</th>
              <th className="px-3 py-2">Reja</th>
              <th className="px-3 py-2">Yaratilgan</th>
              <th className="px-3 py-2">Faollik</th>
              <th className="px-3 py-2">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="px-3 py-3">
                  <p>{user.name ?? "—"}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                  {user.is_suspended ? <p className="text-xs text-red-400">To&apos;xtatilgan</p> : null}
                </td>
                <td className="px-3 py-3">
                  <PlanBadge plan={user.plan} />
                </td>
                <td className="px-3 py-3 text-muted">{new Date(user.created_at).toLocaleDateString("uz-UZ")}</td>
                <td className="px-3 py-3 text-muted">
                  {user.last_seen_at ? new Date(user.last_seen_at).toLocaleDateString("uz-UZ") : "—"}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Button variant="ghost" onClick={() => void patch(user.id, { plan: "free" })}>
                      Free
                    </Button>
                    <Button variant="ghost" onClick={() => void patch(user.id, { plan: "pro" })}>
                      Pro
                    </Button>
                    <Button variant="ghost" onClick={() => void patch(user.id, { plan: "pro_plus" })}>
                      Pro Plus
                    </Button>
                    <Button variant="ghost" onClick={() => void patch(user.id, { plan: "pro_max" })}>
                      Pro Max
                    </Button>
                    <Button variant="ghost" onClick={() => void patch(user.id, { suspended: !user.is_suspended })}>
                      {user.is_suspended ? "Tiklash" : "To'xtatish"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
