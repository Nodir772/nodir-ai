import assert from "node:assert/strict";
import { test } from "node:test";
import { buildModelContext } from "./context";

test("always prepends the system prompt", () => {
  const result = buildModelContext([{ role: "user", content: "Salom" }]);
  assert.equal(result.messages[0]?.role, "system");
  assert.equal(result.messages.at(-1)?.content, "Salom");
  assert.equal(result.trimmed, false);
});

test("keeps recent messages for long conversations", () => {
  const history = Array.from({ length: 40 }, (_, index) => ({
    role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
    content: `msg-${index}`,
  }));
  const result = buildModelContext(history);
  assert.equal(result.trimmed, true);
  assert.ok(result.messages.length <= 25);
  assert.equal(result.messages[0]?.role, "system");
});
