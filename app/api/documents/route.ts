import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { ensureProfile } from "@/lib/db/profiles";
import { getProject } from "@/lib/db/projects";
import { chunkText } from "@/lib/documents/chunk";
import { extractDocumentText } from "@/lib/documents/extract";
import { FILE_ERRORS, formatBytes } from "@/lib/files/validate";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { limitRoute } from "@/lib/security/rate-limit";
import { getPlan } from "@/lib/billing/plans";
import { assertFeature, entitlementJson } from "@/lib/billing/entitlements";
import { assertUsage, recordUsage, usageLimitJson } from "@/lib/usage/track";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonError(message: string, code: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ error: message, code, ...extra }, { status });
}

export async function GET(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) return jsonError("Davom etish uchun tizimga kiring.", "UNAUTHORIZED", 401);
  if (!isSupabaseConfigured()) return Response.json({ documents: [], persistence: false });
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return jsonError("Davom etish uchun tizimga kiring.", "UNAUTHORIZED", 401);
  const projectId = new URL(request.url).searchParams.get("projectId");
  let query = supabase
    .from("documents")
    .select("id, filename, mime_type, byte_size, created_at, project_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) return jsonError("Ma'lumotlarni yuklashda xatolik yuz berdi.", "DATABASE_ERROR", 500);
  return Response.json({ documents: data ?? [], persistence: true });
}

export async function POST(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) return jsonError("Davom etish uchun tizimga kiring.", "UNAUTHORIZED", 401);
  const gated = limitRoute(request, "documents", identity.plan);
  if (!gated.ok) return jsonError("So'rovlar juda ko'p.", "RATE_LIMIT", 429);
  const feature = await assertFeature(identity, "documents");
  if (!feature.ok) return entitlementJson(feature);

  const { supabase, user } = isSupabaseConfigured() ? await requireUser() : { supabase: null, user: null };
  const usage = await assertUsage(request, "documents", supabase);
  if (!usage.ok) {
    if (usage.code === "USAGE_LIMIT" && "limit" in usage) return usageLimitJson(usage);
    return jsonError(usage.error, usage.code, usage.status, {
      title: "title" in usage ? usage.title : undefined,
      cta: "cta" in usage ? usage.cta : undefined,
    });
  }

  const form = await request.formData();
  const file = form.get("file");
  const projectIdRaw = form.get("projectId");
  const projectId = typeof projectIdRaw === "string" && projectIdRaw.trim() ? projectIdRaw.trim() : null;
  if (!(file instanceof File)) {
    return jsonError("Fayl tanlanmadi.", "NO_FILE", 400);
  }
  if (projectId && supabase && user) {
    const owned = await getProject(supabase, user.id, projectId);
    if (!owned.ok) {
      return jsonError(
        owned.forbidden ? "Bu loyihaga kirish huquqingiz yo'q." : "Loyiha topilmadi.",
        owned.forbidden ? "FORBIDDEN" : "NOT_FOUND",
        owned.forbidden ? 403 : 404,
      );
    }
  }
  const maxBytes = getPlan(identity.plan).fileSizeLimit;
  if (file.size > maxBytes) {
    return jsonError(FILE_ERRORS.tooLarge, "FILE_TOO_LARGE", 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let extracted;
  try {
    extracted = await extractDocumentText(bytes, file.name, file.type);
  } catch {
    return jsonError("Faylni o'qishda xatolik yuz berdi.", "EXTRACT_FAILED", 422);
  }
  if (!extracted.ok) {
    return jsonError(extracted.error, extracted.code ?? "FILE_UNSUPPORTED", 400);
  }

  await recordUsage(request, "documents", supabase);
  const chunks = chunkText(extracted.text);
  const preview = extracted.text.slice(0, 400);

  if (!supabase || !user) {
    return Response.json({
      document: {
        id: crypto.randomUUID(),
        filename: file.name,
        mimeType: file.type,
        byteSize: file.size,
        sizeLabel: formatBytes(file.size),
        preview,
        chunkCount: chunks.length,
        text: extracted.text,
        createdAt: new Date().toISOString(),
      },
      persistence: false,
    });
  }

  await ensureProfile(supabase, user);
  const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
  await supabase.storage.from("documents").upload(path, bytes, { contentType: file.type || "application/octet-stream" });
  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      filename: file.name,
      mime_type: file.type,
      byte_size: file.size,
      storage_path: path,
      extracted_text: extracted.text,
      project_id: projectId,
    })
    .select("id, filename, mime_type, byte_size, created_at")
    .single();
  if (error || !data) {
    return Response.json({
      document: {
        id: crypto.randomUUID(),
        filename: file.name,
        sizeLabel: formatBytes(file.size),
        preview,
        chunkCount: chunks.length,
        text: extracted.text,
      },
      persistence: false,
    });
  }

  return Response.json({
    document: {
      id: data.id,
      filename: data.filename,
      mimeType: data.mime_type,
      byteSize: data.byte_size,
      sizeLabel: formatBytes(data.byte_size),
      preview,
      chunkCount: chunks.length,
      createdAt: data.created_at,
    },
    persistence: true,
  });
}
