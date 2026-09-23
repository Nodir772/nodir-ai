-- Phase 5 platform tables. RLS always keys off auth.uid().
-- Files live in Storage; tables store metadata and paths only.

create table if not exists public.tool_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tool text not null,
  created_at timestamptz not null default now()
);

create index if not exists tool_usage_user_day_idx on public.tool_usage (user_id, created_at desc);
create index if not exists tool_usage_tool_idx on public.tool_usage (user_id, tool, created_at desc);

create table if not exists public.generated_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  prompt text not null,
  style text,
  aspect_ratio text,
  quality text,
  storage_path text not null,
  favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists generated_images_user_idx on public.generated_images (user_id, created_at desc);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  filename text not null,
  mime_type text,
  byte_size integer not null default 0,
  storage_path text,
  extracted_text text,
  created_at timestamptz not null default now()
);

create index if not exists documents_user_idx on public.documents (user_id, created_at desc);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_type text not null check (item_type in ('conversation', 'image', 'message')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

create table if not exists public.shared_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique,
  title text,
  content text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists shared_messages_token_idx on public.shared_messages (token);

alter table public.tool_usage enable row level security;
alter table public.generated_images enable row level security;
alter table public.documents enable row level security;
alter table public.favorites enable row level security;
alter table public.shared_messages enable row level security;

create policy "tool_usage_own" on public.tool_usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "generated_images_own" on public.generated_images
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "documents_own" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "favorites_own" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "shared_messages_own_write" on public.shared_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public read is only for rows explicitly marked public. Token is unguessable UUID text.
create policy "shared_messages_public_read" on public.shared_messages
  for select using (is_public = true);

-- Storage buckets (run in SQL editor if the dashboard has not created them yet)
insert into storage.buckets (id, name, public)
values ('generated-images', 'generated-images', false),
       ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "storage_generated_images_own"
on storage.objects for all
using (bucket_id = 'generated-images' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'generated-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "storage_documents_own"
on storage.objects for all
using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
