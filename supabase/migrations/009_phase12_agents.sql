-- Phase 12: agents, tasks, automations, agent chat, memory isolation, favorites.

-- ---------------------------------------------------------------------------
-- Agents (custom). Built-in catalog lives in application code.
-- ---------------------------------------------------------------------------

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text not null default '',
  icon text not null default 'sparkles',
  instructions text not null default '',
  allowed_tools jsonb not null default '[]'::jsonb,
  model text not null default 'nodir-balanced',
  enabled boolean not null default true,
  project_id uuid references public.projects (id) on delete set null,
  published boolean not null default false,
  public_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agents_user_updated_idx
  on public.agents (user_id, updated_at desc);

create index if not exists agents_user_enabled_idx
  on public.agents (user_id, enabled);

create index if not exists agents_project_idx
  on public.agents (project_id)
  where project_id is not null;

alter table public.agents enable row level security;

drop policy if exists "agents_select_own" on public.agents;
create policy "agents_select_own" on public.agents
  for select using (auth.uid() = user_id or (published = true and public_slug is not null));

drop policy if exists "agents_insert_own" on public.agents;
create policy "agents_insert_own" on public.agents
  for insert with check (auth.uid() = user_id);

drop policy if exists "agents_update_own" on public.agents;
create policy "agents_update_own" on public.agents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "agents_delete_own" on public.agents;
create policy "agents_delete_own" on public.agents
  for delete using (auth.uid() = user_id);

drop trigger if exists agents_set_updated_at on public.agents;
create trigger agents_set_updated_at
before update on public.agents
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Agent chat messages (builtin id or custom uuid in agent_id text)
-- ---------------------------------------------------------------------------

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  agent_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists agent_messages_user_agent_idx
  on public.agent_messages (user_id, agent_id, created_at);

alter table public.agent_messages enable row level security;

drop policy if exists "agent_messages_own" on public.agent_messages;
create policy "agent_messages_own" on public.agent_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Tasks + observable steps
-- ---------------------------------------------------------------------------

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  agent_id text not null,
  project_id uuid references public.projects (id) on delete set null,
  title text not null default '',
  input text not null default '',
  kind text not null default 'general'
    check (kind in ('research', 'writing', 'coding', 'study', 'document', 'general')),
  status text not null default 'pending'
    check (status in ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  summary text not null default '',
  result text not null default '',
  sources jsonb not null default '[]'::jsonb,
  files jsonb not null default '[]'::jsonb,
  tools_used jsonb not null default '[]'::jsonb,
  current_step integer not null default 0,
  step_count integer not null default 0,
  tool_calls integer not null default 0,
  retry_count integer not null default 0,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_updated_idx
  on public.tasks (user_id, updated_at desc);

create index if not exists tasks_user_status_idx
  on public.tasks (user_id, status, updated_at desc);

create index if not exists tasks_project_idx
  on public.tasks (project_id, updated_at desc)
  where project_id is not null;

create index if not exists tasks_agent_idx
  on public.tasks (user_id, agent_id, updated_at desc);

alter table public.tasks enable row level security;

drop policy if exists "tasks_own" on public.tasks;
create policy "tasks_own" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

create table if not exists public.task_steps (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  step_index integer not null,
  key text not null,
  label text not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'skipped', 'failed')),
  tool text,
  output text not null default '',
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists task_steps_task_idx
  on public.task_steps (task_id, step_index);

alter table public.task_steps enable row level security;

drop policy if exists "task_steps_own" on public.task_steps;
create policy "task_steps_own" on public.task_steps
  for all using (
    exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Automations (request-triggered / Run now — no cron daemon)
-- ---------------------------------------------------------------------------

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  agent_id text not null,
  project_id uuid references public.projects (id) on delete set null,
  name text not null,
  prompt text not null default '',
  enabled boolean not null default true,
  schedule_enabled boolean not null default false,
  schedule_type text not null default 'once'
    check (schedule_type in ('once', 'daily', 'weekly', 'custom')),
  schedule_value text not null default '',
  next_run_at timestamptz,
  last_run_at timestamptz,
  last_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists automations_user_updated_idx
  on public.automations (user_id, updated_at desc);

create index if not exists automations_next_run_idx
  on public.automations (user_id, next_run_at)
  where schedule_enabled = true;

alter table public.automations enable row level security;

drop policy if exists "automations_own" on public.automations;
create policy "automations_own" on public.automations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists automations_set_updated_at on public.automations;
create trigger automations_set_updated_at
before update on public.automations
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Memories: agent-scoped isolation
-- ---------------------------------------------------------------------------

alter table public.memories
  add column if not exists agent_id text;

create index if not exists memories_agent_idx
  on public.memories (user_id, agent_id, updated_at desc)
  where agent_id is not null;

-- ---------------------------------------------------------------------------
-- Favorites: allow agent
-- ---------------------------------------------------------------------------

alter table public.favorites drop constraint if exists favorites_item_type_check;
alter table public.favorites
  add constraint favorites_item_type_check
  check (item_type in ('conversation', 'image', 'message', 'project', 'agent'));
