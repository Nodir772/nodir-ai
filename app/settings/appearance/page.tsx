"use client";

import { useTheme } from "next-themes";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { apiUpdateSettings } from "@/lib/chat/api";
import { useToast } from "@/components/ui/toast-context";

const THEMES = [
  { id: "system", label: "Tizim" },
  { id: "dark", label: "Qorong'u" },
  { id: "light", label: "Yorug'" },
] as const;

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useI18n();
  const { toast } = useToast();

  return (
    <SettingsShell title="Ko'rinish">
      <p className="text-sm text-muted">Mavzu va interfeys tili. AI javoblari foydalanuvchi yozgan tilda qoladi.</p>
      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium">Mavzu</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`rounded-full border px-3 py-2 text-sm ${
                  theme === item.id ? "border-accent/50 bg-accent/10" : "border-border text-muted"
                }`}
                onClick={() => setTheme(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">Interfeys tili</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {LOCALES.map((id) => (
              <button
                key={id}
                type="button"
                className={`rounded-full border px-3 py-2 text-sm ${
                  locale === id ? "border-accent/50 bg-accent/10" : "border-border text-muted"
                }`}
                onClick={() => {
                  setLocale(id);
                  void apiUpdateSettings({ uiLocale: id }).then((result) => {
                    if (!result.ok) toast("Til saqlanmadi. Mahalliy sozlama ishlatiladi.", "error");
                  });
                }}
              >
                {LOCALE_LABELS[id]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SettingsShell>
  );
}
