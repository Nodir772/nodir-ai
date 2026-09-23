import { validateUpload } from "@/lib/files/validate";

export async function extractDocumentText(bytes: Uint8Array, filename: string, mime?: string) {
  const checked = validateUpload(bytes, filename, mime);
  if (!checked.ok) return checked;

  if (checked.kind === "txt" || checked.kind === "csv") {
    return { ok: true as const, text: new TextDecoder("utf-8", { fatal: false }).decode(bytes) };
  }

  if (checked.kind === "pdf") {
    const { extractText } = await import("unpdf");
    const { text } = await extractText(bytes);
    const joined = Array.isArray(text) ? text.join("\n") : String(text ?? "");
    return { ok: true as const, text: joined };
  }

  if (checked.kind === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return { ok: true as const, text: result.value };
  }

  return {
    ok: false as const,
    error: "Bu fayl hujjat tahlili uchun mos emas.",
    code: "FILE_UNSUPPORTED",
  };
}
