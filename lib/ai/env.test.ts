import assert from "node:assert/strict";
import { test } from "node:test";
import { getOpenAiApiKey, isOpenAiApiKeyPlausible, sanitizeOpenAiApiKeyForTests } from "./env";
import { isOpenAiConfigured } from "./config";

test("strips whitespace and surrounding quotes from API keys", () => {
  assert.equal(sanitizeOpenAiApiKeyForTests('  "sk-test"  '), "sk-test");
  assert.equal(sanitizeOpenAiApiKeyForTests("'sk-test'"), "sk-test");
  assert.equal(sanitizeOpenAiApiKeyForTests("\uFEFFsk-test\n"), "sk-test");
  assert.equal(sanitizeOpenAiApiKeyForTests("   "), "");
});

test("reads only OPENAI_API_KEY, never NEXT_PUBLIC_OPENAI_API_KEY", () => {
  const previous = process.env.OPENAI_API_KEY;
  const previousPublic = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  try {
    process.env.OPENAI_API_KEY = "";
    process.env.NEXT_PUBLIC_OPENAI_API_KEY = "sk-should-never-be-used";
    assert.equal(getOpenAiApiKey(), "");
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
    if (previousPublic === undefined) delete process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    else process.env.NEXT_PUBLIC_OPENAI_API_KEY = previousPublic;
  }
});

test("placeholder-length keys are present but not plausible", () => {
  const previous = process.env.OPENAI_API_KEY;
  try {
    process.env.OPENAI_API_KEY = "sk-...";
    assert.equal(getOpenAiApiKey(), "sk-...");
    assert.equal(isOpenAiApiKeyPlausible(), false);
    assert.equal(isOpenAiConfigured(), false);
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
  }
});
