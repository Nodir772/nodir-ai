import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/db/types";
import { AVATAR_SRC } from "@/lib/constants";
import { resolvePlanId } from "@/lib/billing/plans";

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  plan: Profile["plan"];
  role?: string;
  is_suspended?: boolean;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
    plan: resolvePlanId(row.plan),
    role: row.role === "admin" ? "admin" : "user",
    isSuspended: Boolean(row.is_suspended),
    lastSeenAt: row.last_seen_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getProfile(supabase: SupabaseClient, userId: string) {
  const full = await supabase
    .from("profiles")
    .select("id, name, email, avatar_url, plan, role, is_suspended, last_seen_at, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();
  if (!full.error) return full.data ? mapProfile(full.data as ProfileRow) : null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, avatar_url, plan, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data as ProfileRow) : null;
}

export async function ensureProfile(supabase: SupabaseClient, user: User) {
  const existing = await getProfile(supabase, user.id);
  if (existing) return existing;

  const name =
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    user.email?.split("@")[0] ||
    null;

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      name,
      email: user.email,
      avatar_url: typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
      plan: "free",
    })
    .select("id, name, email, avatar_url, plan, role, is_suspended, last_seen_at, created_at, updated_at")
    .single();

  if (error) throw error;
  return mapProfile(data as ProfileRow);
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  patch: { name?: string; avatarUrl?: string | null },
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.avatarUrl !== undefined ? { avatar_url: patch.avatarUrl } : {}),
    })
    .eq("id", userId)
    .select("id, name, email, avatar_url, plan, role, is_suspended, last_seen_at, created_at, updated_at")
    .single();
  if (error) throw error;
  return mapProfile(data as ProfileRow);
}

export function displayAvatar(profile: Profile | null) {
  return profile?.avatarUrl || AVATAR_SRC;
}
