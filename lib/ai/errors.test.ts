import assert from "node:assert/strict";
import { test } from "node:test";
import OpenAI from "openai";
import { mapProviderError } from "./errors";
import { USER_ERRORS } from "./error-copy";

function apiError(status: number, message: string) {
  return new OpenAI.APIError(status, { error: { message } }, message, undefined as never);
}

test("maps OpenAI statuses to distinct codes, never MISSING_API_KEY", () => {
  const mapped = mapProviderError(apiError(401, "Incorrect API key provided"));
  assert.equal(mapped.code, "INVALID_API_KEY");
  assert.equal(mapped.message, USER_ERRORS.invalidKey);
  assert.equal(mapped.category, "invalid_key");
  assert.notEqual(mapped.message, "API sozlamalarini tekshiring.");
  assert.equal(mapProviderError(apiError(429, "slow")).code, "RATE_LIMIT");
  assert.equal(mapProviderError(apiError(404, "gone")).code, "MODEL_ERROR");
  const generic = mapProviderError(apiError(500, "boom"));
  assert.equal(generic.code, "OPENAI_API_ERROR");
  assert.notEqual(generic.code, "MISSING_API_KEY");
});

test("maps network failures separately from missing keys", () => {
  const mapped = mapProviderError(new TypeError("fetch failed"));
  assert.equal(mapped.code, "NETWORK_ERROR");
  assert.equal(mapped.message, USER_ERRORS.network);
});

test("maps quota separately from generic rate limits", () => {
  const error = apiError(429, "You exceeded your current quota");
  Object.assign(error, { code: "insufficient_quota" });
  const mapped = mapProviderError(error);
  assert.equal(mapped.code, "QUOTA");
  assert.equal(mapped.message, USER_ERRORS.quota);

  const credits = apiError(429, "You have no credits remaining");
  Object.assign(credits, { code: "credit_balance_exhausted", type: "insufficient_quota" });
  assert.equal(mapProviderError(credits).code, "QUOTA");

  const rate = apiError(429, "Rate limit reached for quota");
  Object.assign(rate, { code: "rate_limit_exceeded" });
  assert.equal(mapProviderError(rate).code, "RATE_LIMIT");
});
