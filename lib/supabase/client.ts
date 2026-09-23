"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig, type SupabasePublicConfig } from "@/lib/supabase/env";

export function createSupabaseBrowserClient(config?: SupabasePublicConfig | null) {
  const resolved = config === undefined ? getSupabasePublicConfig() : config;
  if (!resolved) return null;

  return createBrowserClient(resolved.url, resolved.anonKey);
}
