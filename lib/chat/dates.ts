export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next.getTime();
}

export function conversationGroup(iso: string) {
  const value = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  const yesterday = today - 86_400_000;

  if (value === today) return "Bugun";
  if (value === yesterday) return "Kecha";
  if (value > today - 7 * 86_400_000) return "Oxirgi 7 kun";
  return "Eski";
}

export function formatChatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (startOfDay(date) === startOfDay(now)) {
    return date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
}

export { generateTitle as titleFromMessage } from "@/lib/chat/title";
