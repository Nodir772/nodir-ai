export const SCHEDULE_TYPES = ["once", "daily", "weekly", "custom"] as const;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

export type AutomationRecord = {
  id: string;
  userId: string;
  agentId: string;
  projectId: string | null;
  name: string;
  prompt: string;
  enabled: boolean;
  scheduleEnabled: boolean;
  scheduleType: ScheduleType;
  scheduleValue: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  createdAt: string;
  updatedAt: string;
};

export function isScheduleType(value: string): value is ScheduleType {
  return (SCHEDULE_TYPES as readonly string[]).includes(value);
}

const CUSTOM_RE = /^(every_(hour|day)|every_\d+_hours|weekday_[0-6])$/;

export function validateSchedule(input: { scheduleType?: string; scheduleValue?: string; nextRunAt?: string | null }) {
  const scheduleType = input.scheduleType ?? "once";
  if (!isScheduleType(scheduleType)) {
    return { ok: false as const, error: "Noto'g'ri jadval turi." };
  }
  const value = (input.scheduleValue ?? "").trim();
  if (scheduleType === "custom") {
    if (!CUSTOM_RE.test(value)) {
      return { ok: false as const, error: "Maxsus jadval: every_hour, every_day, every_N_hours yoki weekday_0-6." };
    }
  }
  if (scheduleType === "weekly" && value && !/^([0-6])$/.test(value)) {
    return { ok: false as const, error: "Haftalik jadval 0–6 (yakshanba–shanba) bo'lishi kerak." };
  }
  if (input.nextRunAt) {
    const stamp = Date.parse(input.nextRunAt);
    if (!Number.isFinite(stamp)) return { ok: false as const, error: "next_run_at noto'g'ri." };
  }
  return { ok: true as const, scheduleType, scheduleValue: value };
}

export function computeNextRunAt(
  scheduleType: ScheduleType,
  scheduleValue: string,
  from = new Date(),
): string | null {
  const base = new Date(from.getTime());
  if (scheduleType === "once") return null;
  if (scheduleType === "daily") {
    base.setUTCDate(base.getUTCDate() + 1);
    return base.toISOString();
  }
  if (scheduleType === "weekly") {
    const target = Number.parseInt(scheduleValue || "1", 10);
    const current = base.getUTCDay();
    let delta = (target - current + 7) % 7;
    if (delta === 0) delta = 7;
    base.setUTCDate(base.getUTCDate() + delta);
    return base.toISOString();
  }
  if (scheduleValue === "every_hour") {
    base.setUTCHours(base.getUTCHours() + 1);
    return base.toISOString();
  }
  if (scheduleValue === "every_day") {
    base.setUTCDate(base.getUTCDate() + 1);
    return base.toISOString();
  }
  const hours = scheduleValue.match(/^every_(\d+)_hours$/);
  if (hours) {
    const n = Math.min(24, Math.max(1, Number.parseInt(hours[1]!, 10)));
    base.setUTCHours(base.getUTCHours() + n);
    return base.toISOString();
  }
  const weekday = scheduleValue.match(/^weekday_([0-6])$/);
  if (weekday) return computeNextRunAt("weekly", weekday[1]!, from);
  return null;
}

export const SCHEDULE_NOTICE =
  "Jadval hozircha soat daemonisiz: keyingi ishga tushirish faqat «Hozir ishga tushirish» yoki foydalanuvchi so'rovi orqali. Cron avtomatik ishlamaydi.";
