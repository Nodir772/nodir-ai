import assert from "node:assert/strict";
import { test } from "node:test";
import { checkRateLimit, limitRoute } from "./rate-limit";

test("rate limiter blocks after the configured window cap", () => {
  const key = `test-${Date.now()}-${Math.random()}`;
  assert.equal(checkRateLimit(key, 2, 60_000).ok, true);
  assert.equal(checkRateLimit(key, 2, 60_000).ok, true);
  assert.equal(checkRateLimit(key, 2, 60_000).ok, false);
});

test("auth limits are fixed and not scaled by plan", () => {
  const request = new Request("https://nodir.ai/api/auth/local", {
    headers: { "x-forwarded-for": `auth-${Date.now()}` },
  });
  let allowed = 0;
  for (let i = 0; i < 30; i += 1) {
    if (limitRoute(request, "auth", "pro_max").ok) allowed += 1;
  }
  assert.equal(allowed, 20);
});

test("pro max plan receives a higher per-minute budget than free", () => {
  const request = new Request("https://nodir.ai/api/chat", { headers: { "x-forwarded-for": `rl-${Date.now()}` } });
  let allowed = 0;
  for (let i = 0; i < 40; i += 1) {
    if (limitRoute(request, "chat", "free").ok) allowed += 1;
  }
  const maxRequest = new Request("https://nodir.ai/api/chat", {
    headers: { "x-forwarded-for": `rl-max-${Date.now()}` },
  });
  let maxAllowed = 0;
  for (let i = 0; i < 40; i += 1) {
    if (limitRoute(maxRequest, "chat", "pro_max").ok) maxAllowed += 1;
  }
  assert.ok(maxAllowed > allowed);
});
