import assert from "node:assert/strict";
import { test } from "node:test";
import { isAdminIdentity } from "./role";

test("admin role is authorized", () => {
  assert.equal(isAdminIdentity({ role: "admin", email: "user@example.com" }, []), true);
});

test("non-admin is rejected", () => {
  assert.equal(isAdminIdentity({ role: "user", email: "user@example.com" }, []), false);
  assert.equal(isAdminIdentity({ role: "user", email: "boss@example.com" }, ["boss@example.com"]), true);
});
