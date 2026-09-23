import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { FEATURE_FLAG_KEYS, type FeatureFlagKey } from "@/lib/billing/plans";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const memory = new Map<FeatureFlagKey, boolean>(FEATURE_FLAG_KEYS.map((key) => [key, true]));

export function createServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function isFlagEnabled(key: FeatureFlagKey): Promise<boolean> {
  if (!isSupabaseConfigured()) return memory.get(key) ?? true;
  const admin = createServiceClient();
  if (!admin) return memory.get(key) ?? true;
  try {
    const { data, error } = await admin.from("feature_flags").select("enabled").eq("key", key).maybeSingle();
    if (error || !data) return memory.get(key) ?? true;
    return Boolean((data as { enabled: boolean }).enabled);
  } catch {
    return memory.get(key) ?? true;
  }
}

export async function listFlags() {
  if (!isSupabaseConfigured()) {
    return FEATURE_FLAG_KEYS.map((key) => ({ key, enabled: memory.get(key) ?? true }));
  }
  const admin = createServiceClient();
  if (!admin) return FEATURE_FLAG_KEYS.map((key) => ({ key, enabled: memory.get(key) ?? true }));
  const { data } = await admin.from("feature_flags").select("key, enabled");
  const rows = (data ?? []) as { key: string; enabled: boolean }[];
  return FEATURE_FLAG_KEYS.map((key) => ({
    key,
    enabled: rows.find((row) => row.key === key)?.enabled ?? true,
  }));
}

export async function setFlag(key: FeatureFlagKey, enabled: boolean) {
  memory.set(key, enabled);
  const admin = createServiceClient();
  if (!admin) return;
  await admin.from("feature_flags").upsert({ key, enabled, updated_at: new Date().toISOString() });
}
