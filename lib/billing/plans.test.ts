import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getPlan,
  isHighestPlan,
  nextPlanId,
  recommendedUpgrade,
  requiredPlanForModel,
  requiredPlanForTool,
  resolvePlanId,
  yearlySavingsMonths,
} from "./plans";

test("plan ids and prices match Phase 8 catalog", () => {
  assert.equal(getPlan("free").price, 0);
  assert.equal(getPlan("pro").price, 7);
  assert.equal(getPlan("pro").yearlyPrice, 70);
  assert.equal(getPlan("pro_plus").price, 10);
  assert.equal(getPlan("pro_plus").yearlyPrice, 100);
  assert.equal(getPlan("pro_plus").popular, true);
  assert.equal(getPlan("pro_max").price, 15);
  assert.equal(getPlan("pro_max").yearlyPrice, 150);
  assert.equal(yearlySavingsMonths(getPlan("pro")), 2);
  assert.equal(yearlySavingsMonths(getPlan("pro_plus")), 2);
  assert.equal(yearlySavingsMonths(getPlan("pro_max")), 2);
});

test("monthly limits increase by tier", () => {
  const free = getPlan("free");
  const pro = getPlan("pro");
  const plus = getPlan("pro_plus");
  const max = getPlan("pro_max");
  assert.equal(free.aiMessages, 50);
  assert.equal(free.imageGenerations, 5);
  assert.equal(free.documentAnalyses, 3);
  assert.equal(free.webSearches, 10);
  assert.equal(free.voiceMinutes, 30);
  assert.ok(pro.aiMessages > free.aiMessages);
  assert.ok(plus.aiMessages > pro.aiMessages);
  assert.ok(max.aiMessages > plus.aiMessages);
  assert.ok(plus.rateLimit > pro.rateLimit);
  assert.ok(max.rateLimit > plus.rateLimit);
  assert.ok(max.fileSizeLimit >= plus.fileSizeLimit);
  assert.ok(free.agentCount >= 1);
  assert.equal(free.customAgentCount, 0);
  assert.ok(pro.customAgentCount > free.customAgentCount);
  assert.ok(plus.tasksPerMonth > pro.tasksPerMonth);
  assert.ok(max.maxToolCallsPerTask >= plus.maxToolCallsPerTask);
  assert.ok(max.maxStepsPerTask >= plus.maxStepsPerTask);
});

test("model and tool access is plan-gated", () => {
  assert.deepEqual(getPlan("free").allowedModels, ["nodir-fast"]);
  assert.ok(getPlan("pro").allowedModels.includes("nodir-balanced"));
  assert.equal(getPlan("pro").allowedModels.includes("nodir-advanced"), false);
  assert.ok(getPlan("pro_plus").allowedModels.includes("nodir-advanced"));
  assert.ok(getPlan("pro_max").allowedModels.includes("nodir-advanced"));
  assert.equal(requiredPlanForModel("nodir-advanced"), "pro_plus");
  assert.equal(requiredPlanForTool("code"), "pro");
});

test("upgrade recommendation walks FREE → PRO → PRO PLUS → PRO MAX", () => {
  assert.equal(nextPlanId("free"), "pro");
  assert.equal(recommendedUpgrade("free")?.price, 7);
  assert.equal(recommendedUpgrade("pro")?.plan, "pro_plus");
  assert.equal(recommendedUpgrade("pro")?.price, 10);
  assert.equal(recommendedUpgrade("pro_plus")?.plan, "pro_max");
  assert.equal(recommendedUpgrade("pro_plus")?.price, 15);
  assert.equal(recommendedUpgrade("pro_max"), null);
  assert.equal(isHighestPlan("pro_max"), true);
});

test("legacy premium and unknown client plan strings cannot spoof access", () => {
  assert.equal(resolvePlanId("premium"), "pro_max");
  assert.equal(resolvePlanId("pro_max"), "pro_max");
  assert.equal(resolvePlanId("enterprise"), "free");
  assert.equal(resolvePlanId("admin"), "free");
  assert.equal(resolvePlanId("pro_max_hack"), "free");
  assert.equal(getPlan("not-a-plan").id, "free");
  assert.equal(getPlan("pro_plus").allowedModels.includes("nodir-advanced"), true);
  assert.equal(getPlan("free").allowedModels.includes("nodir-advanced"), false);
});
