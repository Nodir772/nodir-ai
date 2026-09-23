"use client";

import { useState } from "react";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { Button } from "@/components/ui/Button";
import { apiUpdateSettings } from "@/lib/chat/api";
import { useToast } from "@/components/ui/toast-context";
import { useChat } from "@/components/chat/ChatProvider";

export default function NotificationSettingsPage() {
  const { settings, updateSettings } = useChat();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  return (
    <SettingsShell title="Bildirishnomalar">
      <p className="text-sm text-muted">Vazifa va avtomatlashtirish natijalari AI kategoriyasida. Email jo&apos;natish faqat provayder sozlanganda.</p>
      <div className="mt-5 space-y-3">
        <Toggle
          label="Mahsulot yangiliklari"
          checked={settings.productUpdates}
          onChange={(value) => void updateSettings({ productUpdates: value })}
        />
        <Toggle
          label="Limit ogohlantirishlari"
          checked={settings.usageAlerts}
          onChange={(value) => void updateSettings({ usageAlerts: value })}
        />
        <Toggle
          label="Email (ixtiyoriy)"
          checked={settings.emailNotifications}
          onChange={(value) => void updateSettings({ emailNotifications: value })}
        />
        <Button
          disabled={saving}
          onClick={() => {
            setSaving(true);
            void apiUpdateSettings({
              notifyProduct: settings.productUpdates,
              notifyUsage: settings.usageAlerts,
              notifyEmail: settings.emailNotifications,
            }).then((result) => {
              setSaving(false);
              toast(result.ok ? "Saqlandi" : "Saqlanmadi", result.ok ? "success" : "error");
            });
          }}
        >
          Saqlash
        </Button>
      </div>
    </SettingsShell>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
