"use client";

import Link from "next/link";
import { SettingsShell } from "@/components/settings/SettingsShell";

export default function SettingsHubPage() {
  return (
    <SettingsShell title="Sozlamalar">
      <p className="text-sm text-muted">
        Profil, mavzu va AI sozlamalarini chatdagi Sozlamalar oynasidan ham boshqarishingiz mumkin.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link className="rounded-2xl border border-border p-4 hover:bg-surface-2" href="/settings/memory">
          <p className="font-medium">Nodir AI xotirasi</p>
          <p className="mt-1 text-sm text-muted">Yoqish, ko&apos;rish va o&apos;chirish</p>
        </Link>
        <Link className="rounded-2xl border border-border p-4 hover:bg-surface-2" href="/settings/usage">
          <p className="font-medium">Foydalanish</p>
          <p className="mt-1 text-sm text-muted">Oylik limitlar va reja</p>
        </Link>
        <Link className="rounded-2xl border border-border p-4 hover:bg-surface-2" href="/voice">
          <p className="font-medium">Ovozli rejim</p>
          <p className="mt-1 text-sm text-muted">Mikrofon va TTS</p>
        </Link>
        <Link className="rounded-2xl border border-border p-4 hover:bg-surface-2" href="/settings/billing">
          <p className="font-medium">Tariflar va to&apos;lov</p>
          <p className="mt-1 text-sm text-muted">Free, Pro, Pro Plus, Pro Max</p>
        </Link>
        <Link className="rounded-2xl border border-border p-4 hover:bg-surface-2" href="/favorites">
          <p className="font-medium">Sevimlilar</p>
          <p className="mt-1 text-sm text-muted">Suhbatlar va saqlangan javoblar</p>
        </Link>
      </div>
    </SettingsShell>
  );
}
