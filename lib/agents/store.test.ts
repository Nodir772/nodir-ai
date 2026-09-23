import assert from "node:assert/strict";
import { test } from "node:test";
import { localCreateAgent, localGetAgent, localDeleteAgent, resetLocalAgents } from "./local";
import { ownedRow } from "@/lib/projects/access";
import { denyBuiltinMutation } from "./access";

test("unauthenticated mutations are rejected by helpers", () => {
  const deny = denyBuiltinMutation();
  assert.equal(deny.status, 403);
  assert.equal(deny.code, "FORBIDDEN");
});

test("create edit delete and ownership for custom agents", () => {
  resetLocalAgents();
  const created = localCreateAgent("owner", { name: "Yordamchi", allowedTools: ["writing"] });
  assert.equal(created.name, "Yordamchi");
  assert.equal(localGetAgent("other", created.id), null);
  const owned = ownedRow(localGetAgent("owner", created.id), "owner");
  assert.equal(owned.ok, true);
  const foreign = ownedRow(localGetAgent("owner", created.id), "intruder");
  assert.equal(foreign.ok, false);
  assert.equal(localDeleteAgent("owner", created.id), true);
  assert.equal(localGetAgent("owner", created.id), null);
});
