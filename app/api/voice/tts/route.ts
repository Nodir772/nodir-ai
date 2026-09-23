import { getOpenAIClient } from "@/lib/ai/client";
import { USER_ERRORS } from "@/lib/ai/errors";
import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { limitRoute } from "@/lib/security/rate-limit";
import { assertFeature, entitlementJson } from "@/lib/billing/entitlements";
import { assertUsage, recordUsage, usageLimitJson } from "@/lib/usage/track";
import { estimateVoiceMinutes } from "@/lib/usage/voice";
import { clampSpeed, isTtsConfigured, resolveTtsVoice, TTS_VOICES, ttsUnavailableMessage } from "@/lib/voice/tts";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ configured: isTtsConfigured() });
}

export async function POST(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  const limited = limitRoute(request, "voice", identity.plan);
  if (!limited.ok) return Response.json({ error: USER_ERRORS.rateLimit }, { status: 429 });
  const gate = await assertFeature(identity, "voice");
  if (!gate.ok) return entitlementJson(gate);
  if (!isTtsConfigured()) {
    return Response.json({ error: ttsUnavailableMessage(), code: "TTS_UNCONFIGURED" }, { status: 503 });
  }
  const provider = process.env.TTS_PROVIDER?.trim().toLowerCase();
  if (provider !== "openai") {
    return Response.json({ error: ttsUnavailableMessage(), code: "TTS_UNCONFIGURED" }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as { text?: string; voice?: string; speed?: number };
  const text = body.text?.trim() ?? "";
  if (!text) return Response.json({ error: "Matn bo'sh." }, { status: 400 });
  if (text.length > 4_000) return Response.json({ error: "So'rov haddan tashqari katta." }, { status: 400 });

  const minutes = estimateVoiceMinutes(text);
  const supabase = isSupabaseConfigured() ? (await requireUser()).supabase : null;
  const usage = await assertUsage(request, "voice", supabase, minutes);
  if (!usage.ok) {
    if (usage.code === "USAGE_LIMIT" && "limit" in usage) return usageLimitJson(usage);
    return Response.json({ error: usage.error, code: usage.code }, { status: usage.status });
  }

  const client = getOpenAIClient();
  if (!client) {
    return Response.json({ error: ttsUnavailableMessage(), code: "TTS_UNCONFIGURED" }, { status: 503 });
  }
  try {
    const speech = await client.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL?.trim() || "tts-1",
      voice: resolveTtsVoice(body.voice) as (typeof TTS_VOICES)[number],
      input: text,
      speed: clampSpeed(body.speed ?? 1),
    });
    const buffer = Buffer.from(await speech.arrayBuffer());
    await recordUsage(request, "voice", supabase, minutes);
    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "Xizmatda vaqtinchalik muammo yuz berdi." }, { status: 502 });
  }
}
