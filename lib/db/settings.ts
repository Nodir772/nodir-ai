import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbUserSettings } from "@/lib/db/types";

type SettingsRow = {
  id: string;
  user_id: string;
  theme: DbUserSettings["theme"];
  default_model: string | null;
  response_style: string | null;
  memory_enabled?: boolean;
  persona_id?: string;
  voice_enabled?: boolean;
  voice_autoplay?: boolean;
  voice_speed?: number;
  voice_id?: string;
  notify_email?: boolean;
  notify_product?: boolean;
  notify_usage?: boolean;
  onboarding_completed?: boolean;
  use_case?: string | null;
  ui_locale?: string | null;
  created_at: string;
  updated_at: string;
};

const SELECT =
  "id, user_id, theme, default_model, response_style, memory_enabled, persona_id, voice_enabled, voice_autoplay, voice_speed, voice_id, notify_email, notify_product, notify_usage, onboarding_completed, use_case, ui_locale, created_at, updated_at";

function mapSettings(row: SettingsRow): DbUserSettings {
  return {
    id: row.id,
    userId: row.user_id,
    theme: row.theme,
    defaultModel: row.default_model,
    responseStyle: row.response_style,
    memoryEnabled: Boolean(row.memory_enabled),
    personaId: row.persona_id || "nodir",
    voiceEnabled: Boolean(row.voice_enabled),
    voiceAutoplay: Boolean(row.voice_autoplay),
    voiceSpeed: typeof row.voice_speed === "number" ? row.voice_speed : 1,
    voiceId: row.voice_id || "alloy",
    notifyEmail: Boolean(row.notify_email),
    notifyProduct: Boolean(row.notify_product),
    notifyUsage: Boolean(row.notify_usage),
    onboardingCompleted: Boolean(row.onboarding_completed),
    useCase: row.use_case ?? null,
    uiLocale: row.ui_locale === "en" || row.ui_locale === "ru" || row.ui_locale === "uz" ? row.ui_locale : "uz",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type SettingsPatch = Partial<{
  theme: DbUserSettings["theme"];
  defaultModel: string | null;
  responseStyle: string | null;
  memoryEnabled: boolean;
  personaId: string;
  voiceEnabled: boolean;
  voiceAutoplay: boolean;
  voiceSpeed: number;
  voiceId: string;
  notifyEmail: boolean;
  notifyProduct: boolean;
  notifyUsage: boolean;
  onboardingCompleted: boolean;
  useCase: string | null;
  uiLocale: "uz" | "en" | "ru";
}>;

export async function getSettings(supabase: SupabaseClient, userId: string) {
  const full = await supabase.from("user_settings").select(SELECT).eq("user_id", userId).maybeSingle();
  if (!full.error) return full.data ? mapSettings(full.data as SettingsRow) : null;
  const { data, error } = await supabase
    .from("user_settings")
    .select(
      "id, user_id, theme, default_model, response_style, memory_enabled, persona_id, voice_enabled, voice_autoplay, voice_speed, voice_id, notify_email, notify_product, notify_usage, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSettings(data as SettingsRow) : null;
}

export async function updateSettings(supabase: SupabaseClient, userId: string, patch: SettingsPatch) {
  const existing = await getSettings(supabase, userId);
  const payload = {
    user_id: userId,
    theme: patch.theme ?? existing?.theme ?? "dark",
    default_model: patch.defaultModel !== undefined ? patch.defaultModel : existing?.defaultModel,
    response_style: patch.responseStyle !== undefined ? patch.responseStyle : existing?.responseStyle,
    memory_enabled: patch.memoryEnabled ?? existing?.memoryEnabled ?? false,
    persona_id: patch.personaId ?? existing?.personaId ?? "nodir",
    voice_enabled: patch.voiceEnabled ?? existing?.voiceEnabled ?? false,
    voice_autoplay: patch.voiceAutoplay ?? existing?.voiceAutoplay ?? false,
    voice_speed: patch.voiceSpeed ?? existing?.voiceSpeed ?? 1,
    voice_id: patch.voiceId ?? existing?.voiceId ?? "alloy",
    notify_email: patch.notifyEmail ?? existing?.notifyEmail ?? false,
    notify_product: patch.notifyProduct ?? existing?.notifyProduct ?? false,
    notify_usage: patch.notifyUsage ?? existing?.notifyUsage ?? false,
    onboarding_completed: patch.onboardingCompleted ?? existing?.onboardingCompleted ?? false,
    use_case: patch.useCase !== undefined ? patch.useCase : existing?.useCase ?? null,
    ui_locale: patch.uiLocale ?? existing?.uiLocale ?? "uz",
  };

  const upsert = await supabase
    .from("user_settings")
    .upsert(payload, { onConflict: "user_id" })
    .select(SELECT)
    .single();
  if (!upsert.error) return mapSettings(upsert.data as SettingsRow);

  const { ui_locale: unusedLocale, ...legacy } = payload;
  void unusedLocale;
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(legacy, { onConflict: "user_id" })
    .select(
      "id, user_id, theme, default_model, response_style, memory_enabled, persona_id, voice_enabled, voice_autoplay, voice_speed, voice_id, notify_email, notify_product, notify_usage, onboarding_completed, use_case, created_at, updated_at",
    )
    .single();
  if (error) throw error;
  return mapSettings(data as SettingsRow);
}
