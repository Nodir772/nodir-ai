"use client";

import { useState } from "react";
import Link from "next/link";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-context";

export default function PrivacySettingsPage() {
  const { toast } = useToast();
  const [format, setFormat] = useState<"json" | "md" | "txt">("json");

  async function downloadExport() {
    const response = await fetch(`/api/account/export?format=${format}`);
    if (!response.ok) {
      toast("Eksport yuklanmadi.", "error");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nodir-ai-export.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <SettingsShell title="Maxfiylik">
      <p className="text-sm text-muted">
        Suhbatlar, xotira va fayllar faqat sizga tegishli. Kalitlar brauzerga chiqmaydi.{" "}
        <Link href="/privacy" className="text-accent">
          Maxfiylik siyosati
        </Link>
        {" · "}
        <Link href="/terms" className="text-accent">
          Foydalanish shartlari
        </Link>
        .
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="export-format">
          Eksport formati
        </label>
        <select
          id="export-format"
          className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
          value={format}
          onChange={(event) => setFormat(event.target.value as "json" | "md" | "txt")}
        >
          <option value="json">JSON</option>
          <option value="md">Markdown</option>
          <option value="txt">TXT</option>
        </select>
        <Button onClick={() => void downloadExport()}>Ma&apos;lumotlarni yuklab olish</Button>
      </div>
    </SettingsShell>
  );
}
