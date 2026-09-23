import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDuckDuckGoHtml, parseWikipediaOpensearch } from "./providers";

test("parses DuckDuckGo HTML result links", () => {
  const html = `
    <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpage">Example Title</a>
    <a class="result__snippet">Short snippet about the topic.</a>
  `;
  const hits = parseDuckDuckGoHtml(html);
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.title, "Example Title");
  assert.equal(hits[0]?.url, "https://example.com/page");
  assert.match(hits[0]?.snippet ?? "", /Short snippet/);
});

test("parses Wikipedia OpenSearch arrays", () => {
  const hits = parseWikipediaOpensearch([
    "Tashkent",
    ["Tashkent"],
    ["Capital of Uzbekistan"],
    ["https://en.wikipedia.org/wiki/Tashkent"],
  ]);
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.domain, "en.wikipedia.org");
  assert.equal(hits[0]?.snippet, "Capital of Uzbekistan");
});
