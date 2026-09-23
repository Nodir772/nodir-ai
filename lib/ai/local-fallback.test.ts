import assert from "node:assert/strict";
import { test } from "node:test";
import { buildLocalAssistantReply, chunkLocalReply } from "./local-fallback";

test("local fallback greets without asking for payment", () => {
  const text = buildLocalAssistantReply([{ role: "user", content: "Salom" }]);
  assert.match(text, /Nodir AI/);
  assert.doesNotMatch(text, /kredit|billing|quota/i);
});

test("local fallback answers from sources without asking for a goal", () => {
  const text = buildLocalAssistantReply([{ role: "user", content: "Toshkent nima?" }], [
    { title: "Tashkent", url: "https://en.wikipedia.org/wiki/Tashkent", snippet: "Capital city", domain: "en.wikipedia.org" },
  ]);
  assert.match(text, /wikipedia.org/);
  assert.match(text, /Capital city/);
  assert.doesNotMatch(text, /maqsadni|tilni belgilang/i);
});

test("local fallback writes a calculator instead of asking for a goal", () => {
  const text = buildLocalAssistantReply([
    { role: "user", content: "qara birgalikda sen bilan kalkulyatrni kodini yozamiz bowidan oxirgacha ozin yozber" },
  ]);
  assert.match(text, /<button/);
  assert.match(text, /display/);
  assert.doesNotMatch(text, /maqsadni 1 gapda|tilni belgilang/i);
});

test("local fallback chunks stay joinable", () => {
  const text = buildLocalAssistantReply([{ role: "user", content: "Python da hello world" }]);
  assert.equal(chunkLocalReply(text).join(""), text);
  assert.match(text, /print\("Hello, World"\)/);
});
