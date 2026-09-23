import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, supabase: null as Awaited<ReturnType<typeof createSupabaseServerClient>> };
  }
  const supabase = await createSupabaseServerClient();
  return { user, supabase };
}
