"use client";

import { useState } from "react";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/toast-context";

export default function ProfileSettingsPage() {
  const { user, updateName } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <SettingsShell title="Profil">
      <p className="text-sm text-muted">Ism va email hisobingizga bog&apos;langan.</p>
      <div className="mt-5 max-w-md space-y-4">
        <Field label="Ism">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Email">
          <Input value={user?.email ?? ""} disabled />
        </Field>
        <Button
          disabled={saving || !name.trim()}
          onClick={() => {
            setSaving(true);
            void updateName(name.trim())
              .then((error) => {
                if (error) toast(error, "error");
                else toast("Saqlandi", "success");
              })
              .finally(() => setSaving(false));
          }}
        >
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </SettingsShell>
  );
}
