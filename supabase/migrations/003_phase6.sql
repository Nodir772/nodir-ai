-- Phase 6: memory, settings extensions, shared conversations, notifications.
-- RLS keys off auth.uid() on every user-owned table.

-- ---------------------------------------------------------------------------
-- Memories
-- ---------------------------------------------------------------------------

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  category text not null default 'general'
    check (category in ('preference', 'project', 'learning', 'general')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memories_user_idx on public.memories (user_id, updated_at desc);
create index if not exists memories_category_idx on public.memories (user_id, category);

alter table public.memories enable row level security;

drop policy if exists "memories_own" on public.memories;
create policy "memories_own" on public.memories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists memories_set_updated_at on public.memories;
create trigger memories_set_updated_at
before update on public.memories
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- user_settings extensions
-- ---------------------------------------------------------------------------

alter table public.user_settings
  add column if not exists memory_enabled boolean not null default false;

alter table public.user_settings
  add column if not exists persona_id text not null default 'nodir';

alter table public.user_settings
  add column if not exists voice_enabled boolean not null default false;

alter table public.user_settings
  add column if not exists voice_autoplay boolean not null default false;

alter table public.user_settings
  add column if not exists voice_speed real not null default 1;

alter table public.user_settings
  add column if not exists voice_id text not null default 'alloy';

alter table public.user_settings
  add column if not exists notify_email boolean not null default false;

alter table public.user_settings
  add column if not exists notify_product boolean not null default false;

alter table public.user_settings
  add column if not exists notify_usage boolean not null default false;

-- ---------------------------------------------------------------------------
-- Shared conversations (private by default)
-- ---------------------------------------------------------------------------

create table if not exists public.shared_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique,
  title text not null,
  messages jsonb not null default '[]'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists shared_conversations_token_idx on public.shared_conversations (token);
create index if not exists shared_conversations_user_idx on public.shared_conversations (user_id, created_at desc);

alter table public.shared_conversations enable row level security;

drop policy if exists "shared_conversations_own" on public.shared_conversations;
create policy "shared_conversations_own" on public.shared_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "shared_conversations_public_read" on public.shared_conversations;
create policy "shared_conversations_public_read" on public.shared_conversations
  for select using (is_public = true);
