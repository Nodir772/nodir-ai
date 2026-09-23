import { NextResponse } from "next/server";
import { requirePersistence } from "@/lib/db/http";
import { DB_ERRORS } from "@/lib/db/errors";
import { getSettings, updateSettings, type SettingsPatch } from "@/lib/db/settings";
import { ensureProfile } from "@/lib/db/profiles";
import { isPersonaId } from "@/lib/ai/personas";
import { isResponseStyleId } from "@/lib/ai/style";
import { TTS_VOICES } from "@/lib/voice/tts";

export async function GET() {
  const session = await requirePersistence();
  if (session.error) return session.error;
  try {
    await ensureProfile(session.supabase, session.user);
    const settings = await getSettings(session.supabase, session.user.id);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: DB_ERRORS.load, code: "DATABASE_ERROR" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requirePersistence();
  if (session.error) return session.error;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "So'rov noto'g'ri formatda.", code: "INVALID_JSON" }, { status: 400 });
  }

  const patch: SettingsPatch = {};
  if (body.theme === "dark" || body.theme === "light" || body.theme === "system") patch.theme = body.theme;
  if (typeof body.defaultModel === "string") patch.defaultModel = body.defaultModel;
  if (typeof body.responseStyle === "string" && isResponseStyleId(body.responseStyle)) {
    patch.responseStyle = body.responseStyle;
  }
  if (typeof body.memoryEnabled === "boolean") patch.memoryEnabled = body.memoryEnabled;
  if (typeof body.personaId === "string" && isPersonaId(body.personaId)) patch.personaId = body.personaId;
  if (typeof body.voiceEnabled === "boolean") patch.voiceEnabled = body.voiceEnabled;
  if (typeof body.voiceAutoplay === "boolean") patch.voiceAutoplay = body.voiceAutoplay;
  if (typeof body.voiceSpeed === "number") patch.voiceSpeed = body.voiceSpeed;
  if (typeof body.voiceId === "string" && (TTS_VOICES as readonly string[]).includes(body.voiceId)) {
    patch.voiceId = body.voiceId;
  }
  if (typeof body.notifyEmail === "boolean") patch.notifyEmail = body.notifyEmail;
  if (typeof body.notifyProduct === "boolean") patch.notifyProduct = body.notifyProduct;
  if (typeof body.notifyUsage === "boolean") patch.notifyUsage = body.notifyUsage;
  if (typeof body.onboardingCompleted === "boolean") patch.onboardingCompleted = body.onboardingCompleted;
  if (typeof body.useCase === "string") patch.useCase = body.useCase.slice(0, 40);
  if (body.uiLocale === "uz" || body.uiLocale === "en" || body.uiLocale === "ru") {
    patch.uiLocale = body.uiLocale;
  }

  try {
    await ensureProfile(session.supabase, session.user);
    const settings = await updateSettings(session.supabase, session.user.id, patch);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: DB_ERRORS.save, code: "DATABASE_ERROR" }, { status: 500 });
  }
}
