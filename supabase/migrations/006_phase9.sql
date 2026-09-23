-- Phase 9: notifications, onboarding, search/history indexes.
-- RLS keys off auth.uid(). Do not store chat contents in notifications.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null default 'system'
    check (category in ('system', 'account', 'billing', 'usage', 'ai', 'security')),
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.user_settings
  add column if not exists onboarding_completed boolean not null default false;

alter table public.user_settings
  add column if not exists use_case text;

create index if not exists conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);

create index if not exists conversations_user_title_idx
  on public.conversations (user_id, title);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create index if not exists favorites_user_created_idx
  on public.favorites (user_id, created_at desc);
