import { getOpenAIClient } from "@/lib/ai/client";
import { isOpenAiConfigured } from "@/lib/ai/config";
import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { ensureProfile } from "@/lib/db/profiles";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { limitRoute } from "@/lib/security/rate-limit";
import { assertFeature, entitlementJson } from "@/lib/billing/entitlements";
import { assertUsage, recordUsage, usageLimitJson } from "@/lib/usage/track";

export const runtime = "nodejs";
export const maxDuration = 60;

const STYLES = ["Realistic", "Illustration", "3D", "Anime", "Minimal", "Cinematic"] as const;
const RATIOS = { "1:1": "1024x1024", "16:9": "1792x1024", "9:16": "1024x1792" } as const;

function jsonError(message: string, code: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ error: message, code, ...extra }, { status });
}

export async function GET(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) return jsonError("Davom etish uchun tizimga kiring.", "UNAUTHORIZED", 401);
  if (!isSupabaseConfigured()) {
    return Response.json({ images: [], persistence: false });
  }
  const { user, supabase } = await requireUser();
  if (!user || !supabase) return jsonError("Davom etish uchun tizimga kiring.", "UNAUTHORIZED", 401);
  const url = new URL(request.url);
  const limit = Math.min(40, Math.max(1, Number(url.searchParams.get("limit") ?? "12") || 12));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? "0") || 0);
  const { data, error } = await supabase
    .from("generated_images")
    .select("id, prompt, style, aspect_ratio, quality, storage_path, favorite, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) {
    return jsonError("Ma'lumotlarni yuklashda xatolik yuz berdi.", "DATABASE_ERROR", 500);
  }
  const images = await Promise.all(
    (data ?? []).map(async (row) => {
      const signed = await supabase.storage.from("generated-images").createSignedUrl(row.storage_path, 60 * 60);
      return {
        id: row.id,
        prompt: row.prompt,
        style: row.style,
        aspectRatio: row.aspect_ratio,
        quality: row.quality,
        favorite: row.favorite,
        createdAt: row.created_at,
        url: signed.data?.signedUrl ?? null,
      };
    }),
  );
  return Response.json({ images, persistence: true });
}

export async function POST(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) return jsonError("Davom etish uchun tizimga kiring.", "UNAUTHORIZED", 401);
  const gated = limitRoute(request, "image", identity.plan);
  if (!gated.ok) return jsonError("So'rovlar juda ko'p.", "RATE_LIMIT", 429);
  const feature = await assertFeature(identity, "image");
  if (!feature.ok) return entitlementJson(feature);

  if (!isOpenAiConfigured()) {
    return jsonError("Rasm yaratish xizmati hali sozlanmagan.", "MISSING_API_KEY", 503);
  }

  const { supabase } = isSupabaseConfigured() ? await requireUser() : { supabase: null };
  const usage = await assertUsage(request, "image", supabase);
  if (!usage.ok) {
    if (usage.code === "USAGE_LIMIT" && "limit" in usage) return usageLimitJson(usage);
    return jsonError(usage.error, usage.code, usage.status, {
      title: "title" in usage ? usage.title : undefined,
      cta: "cta" in usage ? usage.cta : undefined,
    });
  }

  let body: { prompt?: string; aspectRatio?: string; style?: string; quality?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("So'rov noto'g'ri formatda.", "INVALID_JSON", 400);
  }

  const prompt = body.prompt?.trim() ?? "";
  if (!prompt) return jsonError("Rasm tavsifi bo'sh bo'lmasligi kerak.", "EMPTY_PROMPT", 400);
  const aspectRatio = body.aspectRatio && body.aspectRatio in RATIOS ? body.aspectRatio : "1:1";
  const style = STYLES.includes(body.style as (typeof STYLES)[number]) ? body.style : "Realistic";
  const quality = body.quality === "High" ? "hd" : "standard";
  const size = RATIOS[aspectRatio as keyof typeof RATIOS];

  const client = getOpenAIClient();
  if (!client) return jsonError("Rasm yaratish xizmati hali sozlanmagan.", "MISSING_API_KEY", 503);

  try {
    const model = process.env.OPENAI_IMAGE_MODEL?.trim() || "dall-e-3";
    const result = await client.images.generate({
      model,
      prompt: `${style} style. ${prompt}`,
      size,
      quality,
      n: 1,
      response_format: "b64_json",
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      return jsonError("Rasm yaratilmadi. Qayta urinib ko'ring.", "EMPTY_IMAGE", 502);
    }

    await recordUsage(request, "image", supabase);

    const dataUrl = `data:image/png;base64,${b64}`;
    if (!supabase) {
      return Response.json({
        image: {
          id: crypto.randomUUID(),
          prompt,
          style,
          aspectRatio,
          quality: body.quality === "High" ? "High" : "Standard",
          favorite: false,
          createdAt: new Date().toISOString(),
          url: dataUrl,
        },
        persistence: false,
      });
    }

    const { user } = await requireUser();
    if (!user) return jsonError("Davom etish uchun tizimga kiring.", "UNAUTHORIZED", 401);
    await ensureProfile(supabase, user);
    const path = `${user.id}/${crypto.randomUUID()}.png`;
    const binary = Buffer.from(b64, "base64");
    const uploaded = await supabase.storage.from("generated-images").upload(path, binary, {
      contentType: "image/png",
      upsert: false,
    });
    if (uploaded.error) {
      return Response.json({
        image: {
          id: crypto.randomUUID(),
          prompt,
          style,
          aspectRatio,
          quality: body.quality === "High" ? "High" : "Standard",
          favorite: false,
          createdAt: new Date().toISOString(),
          url: dataUrl,
        },
        persistence: false,
        warning: "Rasm yaratildi, lekin saqlash sozlanmagan.",
      });
    }

    const { data: row, error } = await supabase
      .from("generated_images")
      .insert({
        user_id: user.id,
        prompt,
        style,
        aspect_ratio: aspectRatio,
        quality: body.quality === "High" ? "High" : "Standard",
        storage_path: path,
      })
      .select("id, created_at")
      .single();
    if (error || !row) {
      return Response.json({
        image: { id: crypto.randomUUID(), prompt, url: dataUrl, createdAt: new Date().toISOString() },
        persistence: false,
      });
    }
    return Response.json({
      image: {
        id: row.id,
        prompt,
        style,
        aspectRatio,
        quality: body.quality === "High" ? "High" : "Standard",
        favorite: false,
        createdAt: row.created_at,
        url: dataUrl,
      },
      persistence: true,
    });
  } catch {
    return jsonError("Xizmatda vaqtinchalik muammo yuz berdi.", "PROVIDER_ERROR", 502);
  }
}
