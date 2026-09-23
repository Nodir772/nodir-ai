export type BillingPeriod = {
  start: Date;
  end: Date;
  resetAt: Date;
};

export function calendarMonthPeriod(now = new Date()): BillingPeriod {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end, resetAt: end };
}

export function billingPeriod(
  subscription?: {
    current_period_start?: string | null;
    current_period_end?: string | null;
  } | null,
  now = new Date(),
): BillingPeriod {
  if (subscription?.current_period_start && subscription?.current_period_end) {
    const start = new Date(subscription.current_period_start);
    const end = new Date(subscription.current_period_end);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start && now >= start && now < end) {
      return { start, end, resetAt: end };
    }
  }
  return calendarMonthPeriod(now);
}

export function periodKey(period: BillingPeriod) {
  return period.start.toISOString().slice(0, 10);
}
