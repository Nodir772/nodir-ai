-- Phase 10: projects, conversation/file/memory project_id, message feedback,
-- message edits. RLS keys off auth.uid(). Never trust client-supplied user_id.

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text not null default '',
  instructions text not null default '',
  icon text not null default 'folder',
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_updated_idx
  on public.projects (user_id, updated_at desc);

create index if not exists projects_user_favorite_idx
  on public.projects (user_id, favorite)
  where favorite = true;

alter table public.projects enable row level security;

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- project_id on conversations, documents (files), memories
-- ---------------------------------------------------------------------------

alter table public.conversations
  add column if not exists project_id uuid references public.projects (id) on delete set null;

alter table public.documents
  add column if not exists project_id uuid references public.projects (id) on delete set null;

alter table public.memories
  add column if not exists project_id uuid references public.projects (id) on delete set null;

create index if not exists conversations_project_idx
  on public.conversations (project_id, updated_at desc)
  where project_id is not null;

create index if not exists conversations_user_project_idx
  on public.conversations (user_id, project_id, updated_at desc);

create index if not exists documents_project_idx
  on public.documents (project_id, created_at desc)
  where project_id is not null;

create index if not exists documents_user_project_idx
  on public.documents (user_id, project_id, created_at desc);

create index if not exists memories_project_idx
  on public.memories (project_id, updated_at desc)
  where project_id is not null;

create index if not exists memories_user_project_idx
  on public.memories (user_id, project_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- Message edits (RLS already scopes via conversation ownership)
-- ---------------------------------------------------------------------------

drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own" on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Message feedback (like / dislike)
-- ---------------------------------------------------------------------------

create table if not exists public.message_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  message_id uuid not null references public.messages (id) on delete cascade,
  rating text not null check (rating in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, message_id)
);

create index if not exists message_feedback_user_idx
  on public.message_feedback (user_id, created_at desc);

create index if not exists message_feedback_message_idx
  on public.message_feedback (message_id);

alter table public.message_feedback enable row level security;

drop policy if exists "message_feedback_own" on public.message_feedback;
create policy "message_feedback_own" on public.message_feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists message_feedback_set_updated_at on public.message_feedback;
create trigger message_feedback_set_updated_at
before update on public.message_feedback
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Favorites: allow projects
-- ---------------------------------------------------------------------------

alter table public.favorites drop constraint if exists favorites_item_type_check;
alter table public.favorites
  add constraint favorites_item_type_check
  check (item_type in ('conversation', 'image', 'message', 'project'));
