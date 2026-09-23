import type { Locale } from "@/lib/i18n/locales";

export const DICTIONARY = {
  nav: {
    home: { uz: "Boshqaruv paneli", en: "Dashboard", ru: "Панель" },
    newChat: { uz: "Yangi suhbat", en: "New chat", ru: "Новый чат" },
    history: { uz: "Chat tarixi", en: "Chat history", ru: "История чата" },
    search: { uz: "Qidirish...", en: "Search...", ru: "Поиск..." },
    projects: { uz: "Loyihalar", en: "Projects", ru: "Проекты" },
    studio: { uz: "Studio", en: "Studio", ru: "Студия" },
    agents: { uz: "Agentlar", en: "Agents", ru: "Агенты" },
    tasks: { uz: "Vazifalar", en: "Tasks", ru: "Задачи" },
    automations: { uz: "Avtomatlashtirish", en: "Automations", ru: "Автоматизация" },
    favorites: { uz: "Sevimlilar", en: "Favorites", ru: "Избранное" },
    settings: { uz: "Sozlamalar", en: "Settings", ru: "Настройки" },
    plan: { uz: "Reja", en: "Plan", ru: "План" },
    voice: { uz: "Ovoz", en: "Voice", ru: "Голос" },
  },
  dashboard: {
    greeting: { uz: "Xush kelibsiz", en: "Welcome back", ru: "С возвращением" },
    continue: { uz: "Davom eting", en: "Continue working", ru: "Продолжить работу" },
    usage: { uz: "Oylik foydalanish", en: "Monthly usage", ru: "Использование за месяц" },
    subscription: { uz: "Joriy tarif", en: "Current plan", ru: "Текущий тариф" },
    recentChats: { uz: "So'nggi suhbatlar", en: "Recent chats", ru: "Недавние чаты" },
    recentProjects: { uz: "So'nggi loyihalar", en: "Recent projects", ru: "Недавние проекты" },
    favoriteAgents: { uz: "Sevimli agentlar", en: "Favorite agents", ru: "Избранные агенты" },
    empty: { uz: "Hozircha bo'sh", en: "Nothing here yet", ru: "Пока пусто" },
  },
  settings: {
    profile: { uz: "Profil", en: "Profile", ru: "Профиль" },
    appearance: { uz: "Ko'rinish", en: "Appearance", ru: "Оформление" },
    memory: { uz: "Xotira", en: "Memory", ru: "Память" },
    privacy: { uz: "Maxfiylik", en: "Privacy", ru: "Конфиденциальность" },
    security: { uz: "Xavfsizlik", en: "Security", ru: "Безопасность" },
    notifications: { uz: "Bildirishnomalar", en: "Notifications", ru: "Уведомления" },
    usage: { uz: "Foydalanish", en: "Usage", ru: "Использование" },
    billing: { uz: "To'lov", en: "Billing", ru: "Оплата" },
    language: { uz: "Interfeys tili", en: "Interface language", ru: "Язык интерфейса" },
    theme: { uz: "Mavzu", en: "Theme", ru: "Тема" },
    save: { uz: "Saqlash", en: "Save", ru: "Сохранить" },
    saved: { uz: "Saqlandi", en: "Saved", ru: "Сохранено" },
  },
  legal: {
    privacyTitle: { uz: "Maxfiylik siyosati", en: "Privacy policy", ru: "Политика конфиденциальности" },
    termsTitle: { uz: "Foydalanish shartlari", en: "Terms of use", ru: "Условия использования" },
  },
  errors: {
    retry: { uz: "Qayta urinish", en: "Retry", ru: "Повторить" },
    generic: { uz: "Xatolik yuz berdi.", en: "Something went wrong.", ru: "Произошла ошибка." },
    unauthorized: { uz: "Davom etish uchun tizimga kiring.", en: "Sign in to continue.", ru: "Войдите, чтобы продолжить." },
  },
} as const;

export type MessageKey = {
  [G in keyof typeof DICTIONARY]: `${G}.${Extract<keyof (typeof DICTIONARY)[G], string>}`;
}[keyof typeof DICTIONARY];

export function translate(locale: Locale, key: MessageKey): string {
  const [group, name] = key.split(".") as [keyof typeof DICTIONARY, string];
  const entry = DICTIONARY[group] as Record<string, Record<Locale, string>>;
  return entry[name]?.[locale] ?? entry[name]?.uz ?? key;
}
