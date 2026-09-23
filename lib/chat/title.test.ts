import assert from "node:assert/strict";
import { test } from "node:test";
import { generateTitle, isMeaningfulMessage } from "./title";

test("keeps greetings from becoming a conversation title", () => {
  assert.equal(isMeaningfulMessage("Salom"), false);
  assert.equal(isMeaningfulMessage("hi"), false);
});

test("titles the first meaningful sentence", () => {
  assert.equal(isMeaningfulMessage("Flutterda Bloc nima uchun kerak?"), true);
  assert.equal(generateTitle("Flutterda Bloc nima uchun kerak?"), "Flutterda Bloc nima uchun kerak?");
});

test("strips code fences from titles", () => {
  const title = generateTitle("```js\nconst x = 1\n```\nLogin sahifasini tuzatish kerak");
  assert.match(title, /Login/);
  assert.doesNotMatch(title, /```/);
});
