create type public.waste_type as enum ('fire', 'complimentary', 'staff_meal', 'defective');

create table public.waste_records (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id),
  caravan_id uuid not null references public.caravans (id),
  inventory_item_id uuid not null references public.inventory_items (id),
  waste_type public.waste_type not null,
  quantity_base numeric(14, 3) not null check (quantity_base > 0),
  reason text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index waste_records_event_idx on public.waste_records (event_id);

alter table public.waste_records enable row level security;

create policy waste_records_select on public.waste_records for select using (public.is_admin());
create policy waste_records_insert on public.waste_records for insert with check (public.is_admin());
