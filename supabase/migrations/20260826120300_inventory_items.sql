create type public.inventory_category as enum (
  'bread', 'sausage', 'cheese', 'sauce', 'topping', 'drink', 'packaging', 'produce', 'other'
);
create type public.unit_type as enum ('count', 'weight', 'portion');
create type public.display_input_unit as enum ('unit', 'gram', 'kg', 'portion');

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category public.inventory_category not null,
  unit_type public.unit_type not null,
  display_input_unit public.display_input_unit not null,
  -- Yalnızca unit_type = 'portion' olan kalemler için (örn. Patates): kg
  -- girişini ana birime (porsiyon) çevirmek için kullanılan katsayı.
  -- Gram bazlı kalemlerde gram/kg dönüşümü sabit (×1000) olduğundan ayrı bir
  -- kolona ihtiyaç yoktur; bu kolon yalnızca "yönetilebilir" porsiyon/kg
  -- dönüşümü gereken kalemler içindir.
  portion_kg_factor numeric(10, 3),
  critical_level numeric(14, 3) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_items_portion_factor_chk check (
    (unit_type = 'portion' and portion_kg_factor is not null and portion_kg_factor > 0)
    or (unit_type <> 'portion' and portion_kg_factor is null)
  ),
  constraint inventory_items_critical_level_chk check (critical_level >= 0)
);

create unique index inventory_items_name_key on public.inventory_items (lower(name));

create trigger trg_inventory_items_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

alter table public.inventory_items enable row level security;

create policy inventory_items_select on public.inventory_items for select using (public.is_admin());
create policy inventory_items_insert on public.inventory_items for insert with check (public.is_admin());
create policy inventory_items_update on public.inventory_items for update using (public.is_admin()) with check (public.is_admin());
