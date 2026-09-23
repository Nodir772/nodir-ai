-- Phase 7 billing, admin, support, flags.
-- RLS: users see only their rows. Admin mutations go through the service role.

alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin'));

alter table public.profiles
  add column if not exists is_suspended boolean not null default false;

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'premium')),
  status text not null default 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_user_idx on public.subscriptions (user_id);
create index if not exists subscriptions_provider_sub_idx on public.subscriptions (provider_subscription_id);

create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feature text not null,
  amount integer not null default 1,
  period_start timestamptz not null,
  period_end timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_records_user_period_idx on public.usage_records (user_id, period_start desc);
create index if not exists usage_records_feature_idx on public.usage_records (user_id, feature, created_at desc);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'stripe',
  event_id text not null unique,
  event_type text not null,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_user_id uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.feature_flags (key, enabled) values
  ('image_generation', true),
  ('document_analysis', true),
  ('web_search', true),
  ('voice', true),
  ('advanced_models', true),
  ('public_sharing', true)
on conflict (key) do nothing;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  category text not null check (category in ('account', 'billing', 'ai', 'bug', 'feature', 'other')),
  message text not null,
  status text not null default 'open' check (status in ('open', 'pending', 'resolved')),
  admin_reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_user_idx on public.support_tickets (user_id, created_at desc);

alter table public.subscriptions enable row level security;
alter table public.usage_records enable row level security;
alter table public.billing_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.feature_flags enable row level security;
alter table public.support_tickets enable row level security;

drop policy if exists "subscriptions_own" on public.subscriptions;
create policy "subscriptions_own" on public.subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "usage_records_insert_own" on public.usage_records;
create policy "usage_records_insert_own" on public.usage_records
  for insert with check (auth.uid() = user_id);

-- billing_events and audit_logs: no client policies (service role only)
drop policy if exists "flags_read" on public.feature_flags;
create policy "flags_read" on public.feature_flags
  for select using (true);

drop policy if exists "tickets_own" on public.support_tickets;
create policy "tickets_own" on public.support_tickets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute procedure public.set_updated_at();

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute procedure public.set_updated_at();
