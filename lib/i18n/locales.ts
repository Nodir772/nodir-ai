export const LOCALES = ["uz", "en", "ru"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "uz";

export const LOCALE_STORAGE_KEY = "nodir-ai:locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "O'zbekcha",
  en: "English",
  ru: "Русский",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "uz" || value === "en" || value === "ru";
}

export function resolveLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
