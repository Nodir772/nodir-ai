export type ChatImageInput = {
  mime: string;
  data: string;
};

const MAX_IMAGES = 4;
const MAX_B64_CHARS = 2_500_000;

export function parseChatImages(raw: unknown): { ok: true; images: ChatImageInput[] } | { ok: false; error: string; code: string } {
  if (raw === undefined) return { ok: true, images: [] };
  if (!Array.isArray(raw)) return { ok: false, error: "Rasm formati noto'g'ri.", code: "INVALID_IMAGE" };
  if (raw.length > MAX_IMAGES) return { ok: false, error: "Bir vaqtda juda ko'p rasm.", code: "TOO_MANY_IMAGES" };
  const images: ChatImageInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return { ok: false, error: "Rasm formati noto'g'ri.", code: "INVALID_IMAGE" };
    const mime = typeof (item as { mime?: string }).mime === "string" ? (item as { mime: string }).mime : "";
    const data = typeof (item as { data?: string }).data === "string" ? (item as { data: string }).data.replace(/^data:[^;]+;base64,/, "") : "";
    if (!data || data.length > MAX_B64_CHARS) {
      return { ok: false, error: "Rasm hajmi juda katta.", code: "FILE_TOO_LARGE" };
    }
    images.push({ mime, data });
  }
  return { ok: true, images };
}

export function sniffImageMime(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return "image/webp";
  return null;
}

export function decodeChatImage(image: ChatImageInput) {
  try {
    const bytes = Uint8Array.from(Buffer.from(image.data, "base64"));
    const sniffed = sniffImageMime(bytes);
    if (!sniffed) return { ok: false as const, error: "Bu rasm turi qo'llab-quvvatlanmaydi.", code: "FILE_UNSUPPORTED" };
    return { ok: true as const, mime: sniffed, bytes };
  } catch {
    return { ok: false as const, error: "Rasm o'qilmadi.", code: "INVALID_IMAGE" };
  }
}
