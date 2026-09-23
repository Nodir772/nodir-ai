-- Phase 11 studio history. Files/images stay in storage.

create table if not exists public.studio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  type text not null check (type in ('writing', 'code', 'research', 'translation', 'summary', 'image', 'document')),
  title text not null default '',
  input_metadata jsonb not null default '{}'::jsonb,
  output_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists studio_items_user_idx on public.studio_items (user_id, created_at desc);
create index if not exists studio_items_type_idx on public.studio_items (user_id, type, created_at desc);
create index if not exists studio_items_project_idx on public.studio_items (project_id);

alter table public.studio_items enable row level security;

drop policy if exists "studio_items_own" on public.studio_items;
create policy "studio_items_own" on public.studio_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists studio_items_set_updated_at on public.studio_items;
create trigger studio_items_set_updated_at
before update on public.studio_items
for each row execute procedure public.set_updated_at();
