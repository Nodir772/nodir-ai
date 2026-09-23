import assert from "node:assert/strict";
import { test } from "node:test";
import { denyBuiltinMutation, resolveListedAgent } from "./access";
import { BUILTIN_AGENTS, canUseBuiltinAgent, getBuiltinAgent, unlockedBuiltinAgents } from "./catalog";
import { publicAgentProfile } from "./types";
import { agentAllowsTool } from "./tools";

test("catalog has the six built-in agents", () => {
  assert.equal(BUILTIN_AGENTS.length, 6);
  assert.ok(getBuiltinAgent("general"));
  assert.ok(getBuiltinAgent("research"));
  assert.ok(getBuiltinAgent("coding"));
  assert.ok(getBuiltinAgent("writing"));
  assert.ok(getBuiltinAgent("study"));
  assert.ok(getBuiltinAgent("document"));
});

test("free plan unlocks only default agents", () => {
  const free = unlockedBuiltinAgents("free").map((item) => item.id);
  assert.ok(free.includes("general"));
  assert.ok(free.includes("writing"));
  assert.ok(free.includes("study"));
  assert.equal(canUseBuiltinAgent("free", "coding"), false);
  assert.equal(canUseBuiltinAgent("free", "research"), false);
  assert.equal(canUseBuiltinAgent("pro", "research"), true);
  assert.equal(canUseBuiltinAgent("pro_plus", "coding"), true);
});

test("public profile omits instructions and memory", () => {
  const agent = getBuiltinAgent("general")!;
  const pub = publicAgentProfile(agent);
  assert.equal("instructions" in pub, false);
  assert.equal("userId" in pub, false);
  assert.ok(pub.name);
});

test("builtin agents cannot be edited or deleted", () => {
  const deny = denyBuiltinMutation();
  assert.equal(deny.status, 403);
});

test("another user's custom agent is forbidden", () => {
  const result = resolveListedAgent("abc", "user-a", "pro", {
    ...getBuiltinAgent("general")!,
    id: "abc",
    userId: "user-b",
    source: "custom",
    published: false,
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 403);
});

test("missing custom agent is 404 not a leak", () => {
  const result = resolveListedAgent("missing", "user-a", "pro", null);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 404);
});

test("tool permission is enforced on the agent allow-list", () => {
  const agent = getBuiltinAgent("writing")!;
  assert.equal(agentAllowsTool(agent.allowedTools, "writing"), true);
  assert.equal(agentAllowsTool(agent.allowedTools, "code"), false);
  assert.equal(agentAllowsTool(agent.allowedTools, "web_search"), false);
});
