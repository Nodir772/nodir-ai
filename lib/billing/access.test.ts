import assert from "node:assert/strict";
import { test } from "node:test";
import { canUseFeature, canUseModel, canUseTool, isUsageExceeded, remainingUsage } from "./access";
import { getPlan } from "./plans";

test("free user uses Fast model and basic tools only", () => {
  assert.equal(canUseModel("free", "nodir-fast"), true);
  assert.equal(canUseModel("free", "nodir-balanced"), false);
  assert.equal(canUseModel("free", "nodir-advanced"), false);
  assert.equal(canUseTool("free", "chat"), true);
  assert.equal(canUseTool("free", "code"), false);
  assert.equal(canUseFeature("free", "advanced_models"), false);
});

test("pro includes search, voice, balanced model, and code", () => {
  assert.equal(canUseFeature("pro", "web_search"), true);
  assert.equal(canUseFeature("pro", "voice"), true);
  assert.equal(canUseModel("pro", "nodir-balanced"), true);
  assert.equal(canUseModel("pro", "nodir-advanced"), false);
  assert.equal(canUseTool("pro", "code"), true);
});

test("pro plus and pro max include advanced models", () => {
  assert.equal(canUseModel("pro_plus", "nodir-advanced"), true);
  assert.equal(canUseModel("pro_max", "nodir-advanced"), true);
  assert.equal(getPlan("pro_max").allowedModels.includes("nodir-fast"), true);
  assert.equal(canUseFeature("pro_max", "advanced_models"), true);
});

test("usage limit is exceeded at the plan cap", () => {
  assert.equal(isUsageExceeded(50, 50), true);
  assert.equal(isUsageExceeded(3, 50), false);
  assert.equal(isUsageExceeded(100, 0), false);
  assert.equal(remainingUsage(10, 50), 40);
});
