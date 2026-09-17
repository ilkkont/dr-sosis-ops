create type public.caravan_status as enum ('active', 'inactive', 'maintenance');

create table public.caravans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plate text,
  status public.caravan_status not null default 'active',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_caravans_updated_at
  before update on public.caravans
  for each row execute function public.set_updated_at();

alter table public.caravans enable row level security;

create policy caravans_select on public.caravans for select using (public.is_admin());
create policy caravans_insert on public.caravans for insert with check (public.is_admin());
create policy caravans_update on public.caravans for update using (public.is_admin()) with check (public.is_admin());
