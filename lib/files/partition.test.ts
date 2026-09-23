import assert from "node:assert/strict";
import { test } from "node:test";
import { partitionAttachments } from "./partition";

test("images never mix into the document extract bucket", () => {
  const split = partitionAttachments([
    { kind: "IMAGE" as const, name: "ozm rasm.jpg" },
    { kind: "DOCUMENT" as const, name: "notes.pdf" },
    { kind: "UNSUPPORTED" as const, name: "run.exe" },
  ]);
  assert.deepEqual(
    split.images.map((item) => item.name),
    ["ozm rasm.jpg"],
  );
  assert.deepEqual(
    split.documents.map((item) => item.name),
    ["notes.pdf"],
  );
  assert.deepEqual(
    split.unsupported.map((item) => item.name),
    ["run.exe"],
  );
});
