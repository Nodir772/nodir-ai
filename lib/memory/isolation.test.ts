import assert from "node:assert/strict";
import { test } from "node:test";
import { localCreate, localList } from "./local";

test("agent memories stay isolated from personal memories", () => {
  const user = `mem-${Date.now()}`;
  localCreate(user, "Shaxsiy afzallik", "preference", null, null);
  localCreate(user, "Agent eslatmasi", "general", null, "agent-1");
  const personal = localList(user, { projectId: null });
  const agent = localList(user, { agentId: "agent-1" });
  assert.equal(personal.length, 1);
  assert.equal(personal[0]?.content, "Shaxsiy afzallik");
  assert.equal(agent.length, 1);
  assert.equal(agent[0]?.content, "Agent eslatmasi");
  assert.equal(localList(user, { agentId: "other" }).length, 0);
});
