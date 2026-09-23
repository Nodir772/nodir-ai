import assert from "node:assert/strict";
import { test } from "node:test";
import { assertAutomationQuota, assertCustomAgentQuota, assertTaskQuota } from "./limits";
import { agentLimitsFor } from "@/lib/billing/plans";

test("plan limits increase by tier", () => {
  const free = agentLimitsFor("free");
  const pro = agentLimitsFor("pro");
  const plus = agentLimitsFor("pro_plus");
  const max = agentLimitsFor("pro_max");
  assert.equal(free.customAgentCount, 0);
  assert.ok(pro.customAgentCount > free.customAgentCount);
  assert.ok(plus.tasksPerMonth > pro.tasksPerMonth);
  assert.ok(max.maxStepsPerTask >= plus.maxStepsPerTask);
  assert.ok(max.maxToolCallsPerTask >= plus.maxToolCallsPerTask);
});

test("free users cannot create custom agents", () => {
  const quota = assertCustomAgentQuota("free", 0);
  assert.equal(quota.ok, false);
  if (!quota.ok) assert.equal(quota.status, 402);
});

test("task monthly cap blocks extra creates", () => {
  const limits = agentLimitsFor("free");
  const blocked = assertTaskQuota("free", limits.tasksPerMonth);
  assert.equal(blocked.ok, false);
  const ok = assertTaskQuota("free", 0);
  assert.equal(ok.ok, true);
});

test("automations are plan gated", () => {
  const free = assertAutomationQuota("free", 0);
  assert.equal(free.ok, false);
  const pro = assertAutomationQuota("pro", 0);
  assert.equal(pro.ok, true);
});
