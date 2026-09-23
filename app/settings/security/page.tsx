"use client";

import { useState } from "react";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/toast-context";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

export default function SecuritySettingsPage() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function deleteAccount() {
    setBusy(true);
    const response = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    setBusy(false);
    setOpen(false);
    if (!response.ok) {
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      toast(json.error ?? "O'chirilmadi.", "error");
      return;
    }
    toast("Hisob o'chirildi.", "success");
    await logout();
    router.push("/");
  }

  return (
    <SettingsShell title="Xavfsizlik">
      <p className="text-sm text-muted">
        Parolni tiklash login sahifasidan. Hisobni o&apos;chirish qaytarib bo&apos;lmaydi va tasdiq talab qiladi.
      </p>
      <div className="mt-5 space-y-3">
        <Button variant="outline" onClick={() => router.push("/forgot-password")}>
          Parolni tiklash
        </Button>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm font-medium">Hisobni o&apos;chirish</p>
          <p className="mt-1 text-sm text-muted">Tasdiqlash uchun DELETE yozing.</p>
          <input
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="mt-3 h-11 w-full max-w-xs rounded-2xl border border-border bg-background px-3 text-sm"
            aria-label="O'chirish tasdigi"
          />
          <Button className="mt-3" disabled={confirm !== "DELETE" || busy} onClick={() => setOpen(true)}>
            Hisobni o&apos;chirish
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={open}
        title="Hisobni o'chirish"
        description="Suhbatlar va xotiralar o'chiriladi. Bu amalni qaytarib bo'lmaydi."
        confirmLabel="O'chirish"
        onClose={() => setOpen(false)}
        onConfirm={() => void deleteAccount()}
      />
    </SettingsShell>
  );
}
