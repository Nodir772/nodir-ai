export const FILE_LIMITS = {
  maxBytes: 64 * 1024 * 1024,
  maxFiles: 4,
  allowedExtensions: ["pdf", "txt", "docx", "csv", "png", "jpg", "jpeg", "webp"] as const,
};

export type AllowedExtension = (typeof FILE_LIMITS.allowedExtensions)[number];

export const FILE_ERRORS = {
  tooLarge: "Fayl hajmi juda katta.",
  unsupported: "Bu fayl turi qo'llab-quvvatlanmaydi.",
  tooMany: "Bir vaqtda juda ko'p fayl tanlandi.",
} as const;

export function extensionOf(name: string) {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop()! : "";
}

export function sniffKind(bytes: Uint8Array, filename: string): AllowedExtension | null {
  const ext = extensionOf(filename);
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return ext === "pdf" ? "pdf" : null;
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return ext === "jpg" || ext === "jpeg" ? "jpg" : null;
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return ext === "png" ? "png" : null;
  }
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return ext === "webp" ? "webp" : null;
  }
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return ext === "docx" ? "docx" : null;
  }
  if (ext === "txt") return "txt";
  if (ext === "csv") {
    if (bytes.includes(0)) return null;
    return "csv";
  }
  return null;
}

export function validateUpload(bytes: Uint8Array, filename: string, declaredType?: string, maxBytes = FILE_LIMITS.maxBytes) {
  void declaredType;
  const cap = Math.min(maxBytes, FILE_LIMITS.maxBytes);
  if (bytes.byteLength > cap) {
    return { ok: false as const, error: FILE_ERRORS.tooLarge, code: "FILE_TOO_LARGE" };
  }
  const kind = sniffKind(bytes, filename);
  if (!kind) {
    return { ok: false as const, error: FILE_ERRORS.unsupported, code: "FILE_UNSUPPORTED" };
  }
  return { ok: true as const, kind };
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
