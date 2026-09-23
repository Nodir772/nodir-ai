import { getRequestIdentity } from "@/lib/auth/request-user";
import { extractDocumentText } from "@/lib/documents/extract";
import { classifyAttachment } from "@/lib/files/classify";
import { FILE_ERRORS, FILE_LIMITS } from "@/lib/files/validate";
import { getPlan } from "@/lib/billing/plans";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) {
    return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  }
  const form = await request.formData();
  const files = form.getAll("files").filter((item): item is File => item instanceof File);
  if (files.length === 0) return Response.json({ error: "Fayl tanlanmadi." }, { status: 400 });
  if (files.length > FILE_LIMITS.maxFiles) {
    return Response.json({ error: FILE_ERRORS.tooMany }, { status: 400 });
  }

  const extracted: { name: string; text?: string; error?: string; class?: string }[] = [];
  const maxBytes = Math.min(getPlan(identity.plan).fileSizeLimit, FILE_LIMITS.maxBytes);
  for (const file of files) {
    if (file.size > maxBytes) {
      extracted.push({ name: file.name, error: FILE_ERRORS.tooLarge });
      continue;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const classified = classifyAttachment(bytes, file.name, file.type, maxBytes);
    if (!classified.ok) {
      extracted.push({ name: file.name, error: classified.error, class: "UNSUPPORTED" });
      continue;
    }
    if (classified.class === "IMAGE") {
      extracted.push({
        name: file.name,
        class: "IMAGE",
        error: "Rasm hujjat tahliliga yuborilmaydi. Chatda rasm tahlilidan foydalaning.",
      });
      continue;
    }
    try {
      const result = await extractDocumentText(bytes, file.name, file.type);
      if (!result.ok) extracted.push({ name: file.name, error: result.error, class: "DOCUMENT" });
      else extracted.push({ name: file.name, text: result.text.slice(0, 12_000), class: "DOCUMENT" });
    } catch {
      extracted.push({ name: file.name, error: "Faylni o'qib bo'lmadi.", class: "DOCUMENT" });
    }
  }
  return Response.json({ files: extracted });
}
