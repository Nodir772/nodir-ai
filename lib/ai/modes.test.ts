import assert from "node:assert/strict";
import { test } from "node:test";
import { AI_MODES, DEFAULT_AI_MODE, getAiMode, isAiModeId, modeInstructions } from "./modes";

test("exposes the six product modes", () => {
  assert.deepEqual(
    AI_MODES.map((mode) => mode.id),
    ["general", "study", "coding", "writing", "research", "creative"],
  );
  assert.equal(DEFAULT_AI_MODE, "general");
});

test("rejects unknown mode ids", () => {
  assert.equal(isAiModeId("general"), true);
  assert.equal(isAiModeId("hacker"), false);
  assert.equal(getAiMode("nope").id, "general");
});

test("returns centralized instructions without inventing sources", () => {
  const text = modeInstructions("research");
  assert.match(text, /Research/);
  assert.match(text, /provided/);
});
