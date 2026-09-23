import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isNotificationCategory,
  type AppNotification,
  type NotificationCategory,
} from "@/lib/notifications/types";

type Row = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

function mapNotification(row: Row): AppNotification {
  return {
    id: row.id,
    category: isNotificationCategory(row.category) ? row.category : "system",
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function listNotifications(supabase: SupabaseClient, userId: string, limit = 40) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, category, title, body, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Row[]).map(mapNotification);
}

export async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  input: { category: NotificationCategory; title: string; body: string },
) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      category: input.category,
      title: input.title.slice(0, 160),
      body: input.body.slice(0, 500),
    })
    .select("id, user_id, category, title, body, read_at, created_at")
    .single();
  if (error) throw error;
  return mapNotification(data as Row);
}

export async function markNotificationRead(supabase: SupabaseClient, userId: string, id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw error;
}

export async function deleteNotification(supabase: SupabaseClient, userId: string, id: string) {
  const { error } = await supabase.from("notifications").delete().eq("user_id", userId).eq("id", id);
  if (error) throw error;
}
