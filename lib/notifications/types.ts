export const NOTIFICATION_CATEGORIES = [
  "system",
  "account",
  "billing",
  "usage",
  "ai",
  "security",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type AppNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export function isNotificationCategory(value: string): value is NotificationCategory {
  return (NOTIFICATION_CATEGORIES as readonly string[]).includes(value);
}

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  system: "Tizim",
  account: "Hisob",
  billing: "To'lov",
  usage: "Foydalanish",
  ai: "AI",
  security: "Xavfsizlik",
};
