import assert from "node:assert/strict";
import { test } from "node:test";
import { ownedRow, ownedStatus } from "./access";

test("denies another user's project row", () => {
  const result = ownedRow({ userId: "a", name: "X" }, "b");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.forbidden, true);
    assert.equal(ownedStatus(result).status, 403);
  }
});

test("returns missing for unknown ids instead of leaking another user", () => {
  const result = ownedRow(null, "a");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.missing, true);
    assert.equal(ownedStatus(result).status, 404);
  }
});

test("accepts the owner", () => {
  const result = ownedRow({ userId: "a", name: "X" }, "a");
  assert.equal(result.ok, true);
});
