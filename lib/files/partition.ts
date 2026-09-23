import type { AttachmentClass } from "@/lib/files/classify";

export function partitionAttachments<T extends { kind: AttachmentClass }>(files: T[]) {
  return {
    images: files.filter((file) => file.kind === "IMAGE"),
    documents: files.filter((file) => file.kind === "DOCUMENT"),
    unsupported: files.filter((file) => file.kind === "UNSUPPORTED"),
  };
}
