import assert from "node:assert/strict";
import { test } from "node:test";
import { getModelCapabilities, modelSupportsVision } from "./capabilities";
import { parseChatImages, sniffImageMime } from "./studio/images";
import { lineDiff } from "./studio/code";
import { isStudioKind } from "./studio/kinds";
import { writingSystemAddon } from "./studio/writing";

test("fast model supports vision because the configured provider model does", () => {
  assert.equal(modelSupportsVision("nodir-fast"), true);
  assert.equal(getModelCapabilities("nodir-advanced").vision, true);
});

test("rejects non-image payloads", () => {
  const result = parseChatImages("nope");
  assert.equal(result.ok, false);
});

test("sniffs jpeg magic", () => {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
  assert.equal(sniffImageMime(bytes), "image/jpeg");
});

test("line diff marks changes", () => {
  const rows = lineDiff("a\nb", "a\nc");
  assert.ok(rows.some((row) => row.type === "remove"));
  assert.ok(rows.some((row) => row.type === "add"));
});

test("studio kinds", () => {
  assert.equal(isStudioKind("writing"), true);
  assert.equal(isStudioKind("hack"), false);
});

test("writing prompts stay centralized", () => {
  assert.match(writingSystemAddon("formal", "shorten", "short"), /Tone: formal/);
});
