create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

create policy audit_logs_select on public.audit_logs for select using (public.is_admin());
create policy audit_logs_insert on public.audit_logs for insert with check (public.is_admin());
-- update/delete policy'si yok: audit log immutable'dır.

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

create trigger trg_app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

create policy app_settings_select on public.app_settings for select using (public.is_admin());
create policy app_settings_insert on public.app_settings for insert with check (public.is_admin());
create policy app_settings_update on public.app_settings for update using (public.is_admin()) with check (public.is_admin());

insert into public.app_settings (key, value) values
  ('negative_stock_policy', '"warn_allow"'),
  ('currency', '"TRY"'),
  ('timezone', '"Europe/Istanbul"');
