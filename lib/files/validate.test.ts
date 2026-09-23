import assert from "node:assert/strict";
import { test } from "node:test";
import { sniffKind, validateUpload } from "./validate";

test("accepts utf-8 text by extension", () => {
  const bytes = new TextEncoder().encode("salom");
  assert.equal(sniffKind(bytes, "notes.txt"), "txt");
  assert.equal(validateUpload(bytes, "notes.txt").ok, true);
});

test("detects pdf magic bytes", () => {
  const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
  assert.equal(sniffKind(bytes, "file.pdf"), "pdf");
});

test("accepts csv text by extension and rejects binary csv", () => {
  const bytes = new TextEncoder().encode("name,age\nAli,20");
  assert.equal(sniffKind(bytes, "data.csv"), "csv");
  assert.equal(validateUpload(bytes, "data.csv").ok, true);
  const binary = new Uint8Array([0x00, 0x01, 0x02]);
  assert.equal(validateUpload(binary, "data.csv").ok, false);
});
