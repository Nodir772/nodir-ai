-- Phase 8 plans: free | pro | pro_plus | pro_max
-- Legacy premium rows become pro_max. Free users are unchanged.

alter table public.profiles drop constraint if exists profiles_plan_check;
update public.profiles set plan = 'pro_max' where plan = 'premium';
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('free', 'pro', 'pro_plus', 'pro_max'));

alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
update public.subscriptions set plan = 'pro_max' where plan = 'premium';
alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('free', 'pro', 'pro_plus', 'pro_max'));

drop policy if exists "usage_records_own" on public.usage_records;
create policy "usage_records_own" on public.usage_records
  for select using (auth.uid() = user_id);

alter table public.usage_records
  alter column amount type numeric using amount::numeric;
