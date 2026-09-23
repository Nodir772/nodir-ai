import { FILE_ERRORS, FILE_LIMITS, sniffKind, validateUpload, type AllowedExtension } from "@/lib/files/validate";

export const ATTACHMENT_CLASSES = ["IMAGE", "DOCUMENT", "UNSUPPORTED"] as const;
export type AttachmentClass = (typeof ATTACHMENT_CLASSES)[number];

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export const DOCUMENT_EXTENSIONS = ["pdf", "txt", "docx", "csv"] as const;

export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;

const IMAGE_MIME: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function classForKind(kind: AllowedExtension): Exclude<AttachmentClass, "UNSUPPORTED"> {
  if ((IMAGE_EXTENSIONS as readonly string[]).includes(kind)) return "IMAGE";
  return "DOCUMENT";
}

export function classifyAttachment(
  bytes: Uint8Array,
  filename: string,
  declaredType?: string,
  maxBytes = FILE_LIMITS.maxBytes,
) {
  const checked = validateUpload(bytes, filename, declaredType, maxBytes);
  if (!checked.ok) {
    return {
      ok: false as const,
      class: "UNSUPPORTED" as const,
      error: checked.error,
      code: checked.code,
    };
  }

  const attachmentClass = classForKind(checked.kind);
  if (attachmentClass === "IMAGE" && bytes.byteLength > IMAGE_MAX_BYTES) {
    return {
      ok: false as const,
      class: "UNSUPPORTED" as const,
      error: FILE_ERRORS.tooLarge,
      code: "FILE_TOO_LARGE" as const,
    };
  }

  return {
    ok: true as const,
    class: attachmentClass,
    kind: checked.kind,
    mime: attachmentClass === "IMAGE" ? IMAGE_MIME[checked.kind] ?? "image/jpeg" : null,
  };
}

export function isImageKind(kind: string) {
  return (IMAGE_EXTENSIONS as readonly string[]).includes(kind);
}

export function isDocumentKind(kind: string) {
  return (DOCUMENT_EXTENSIONS as readonly string[]).includes(kind);
}

export function sniffKindSafe(bytes: Uint8Array, filename: string) {
  return sniffKind(bytes, filename);
}
