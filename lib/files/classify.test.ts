import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyAttachment, classForKind } from "./classify";
import { sniffKind } from "./validate";

test("jpeg magic is IMAGE not DOCUMENT", () => {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
  const result = classifyAttachment(bytes, "ozm rasm.jpg");
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.class, "IMAGE");
    assert.equal(result.mime, "image/jpeg");
  }
});

test("png and webp are IMAGE", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const pngResult = classifyAttachment(png, "a.png");
  assert.equal(pngResult.ok, true);
  if (pngResult.ok) assert.equal(pngResult.class, "IMAGE");
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  const webpResult = classifyAttachment(webp, "a.webp");
  assert.equal(webpResult.ok, true);
  if (webpResult.ok) assert.equal(webpResult.class, "IMAGE");
});

test("pdf is DOCUMENT", () => {
  const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
  const result = classifyAttachment(bytes, "file.pdf");
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.class, "DOCUMENT");
});

test("exe is UNSUPPORTED", () => {
  const bytes = new Uint8Array([0x4d, 0x5a]);
  const result = classifyAttachment(bytes, "run.exe");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.class, "UNSUPPORTED");
});

test("classForKind maps extensions", () => {
  assert.equal(classForKind("jpg"), "IMAGE");
  assert.equal(classForKind("jpeg"), "IMAGE");
  assert.equal(classForKind("docx"), "DOCUMENT");
  assert.equal(sniffKind(new Uint8Array([0xff, 0xd8, 0xff]), "photo.jpeg"), "jpg");
});
