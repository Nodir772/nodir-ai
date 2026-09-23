import assert from "node:assert/strict";
import { test } from "node:test";
import { billingPeriod, calendarMonthPeriod } from "./period";

test("calendar month period is UTC month bounds", () => {
  const period = calendarMonthPeriod(new Date("2026-09-09T12:00:00.000Z"));
  assert.equal(period.start.toISOString(), "2026-09-01T00:00:00.000Z");
  assert.equal(period.end.toISOString(), "2026-10-01T00:00:00.000Z");
});

test("active subscription period is used when it covers now", () => {
  const period = billingPeriod(
    {
      current_period_start: "2026-08-20T00:00:00.000Z",
      current_period_end: "2026-09-20T00:00:00.000Z",
    },
    new Date("2026-09-09T12:00:00.000Z"),
  );
  assert.equal(period.start.toISOString(), "2026-08-20T00:00:00.000Z");
  assert.equal(period.resetAt.toISOString(), "2026-09-20T00:00:00.000Z");
});
