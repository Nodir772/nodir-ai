-- Phase 13 finish: UI locale, storage-friendly indexes, search helpers.

alter table public.user_settings
  add column if not exists ui_locale text not null default 'uz';

alter table public.user_settings
  drop constraint if exists user_settings_ui_locale_check;

alter table public.user_settings
  add constraint user_settings_ui_locale_check
  check (ui_locale in ('uz', 'en', 'ru'));

create index if not exists tasks_user_status_idx
  on public.tasks (user_id, status, updated_at desc);

create index if not exists automations_user_enabled_idx
  on public.automations (user_id, enabled, next_run_at);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);
