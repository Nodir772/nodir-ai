import assert from "node:assert/strict";
import { test } from "node:test";
import { computeNextRunAt, validateSchedule } from "./schedule";

test("rejects invalid custom schedules", () => {
  const bad = validateSchedule({ scheduleType: "custom", scheduleValue: "* * * * *" });
  assert.equal(bad.ok, false);
  const cronny = validateSchedule({ scheduleType: "not-real" });
  assert.equal(cronny.ok, false);
});

test("accepts once daily weekly and safe custom values", () => {
  assert.equal(validateSchedule({ scheduleType: "once" }).ok, true);
  assert.equal(validateSchedule({ scheduleType: "daily" }).ok, true);
  assert.equal(validateSchedule({ scheduleType: "weekly", scheduleValue: "1" }).ok, true);
  assert.equal(validateSchedule({ scheduleType: "custom", scheduleValue: "every_hour" }).ok, true);
  assert.equal(validateSchedule({ scheduleType: "custom", scheduleValue: "every_3_hours" }).ok, true);
});

test("computeNextRunAt is deterministic and bounded", () => {
  const from = new Date("2026-01-01T00:00:00.000Z");
  assert.equal(computeNextRunAt("once", "", from), null);
  const daily = computeNextRunAt("daily", "", from);
  assert.equal(daily, "2026-01-02T00:00:00.000Z");
  const hourly = computeNextRunAt("custom", "every_hour", from);
  assert.equal(hourly, "2026-01-01T01:00:00.000Z");
});
