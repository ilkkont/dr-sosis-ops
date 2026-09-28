-- ---------------------------------------------------------------------------
-- Ana Depo: tüm satın alınan stok önce buraya girilir, etkinliklere buradan
-- gönderilir. stock_movements ile aynı immutable-ledger deseni — bakiye
-- hiçbir zaman bir kolonda tutulmaz, her zaman SUM(quantity_base) ile
-- hesaplanır (bkz. v_depot_balances).
-- ---------------------------------------------------------------------------

alter type public.movement_source_type add value if not exists 'depot';

do $$
begin
  if not exists (select 1 from pg_type where typname = 'depot_movement_type') then
    create type public.depot_movement_type as enum (
      'purchase_in', 'transfer_out_to_event', 'transfer_in_from_event'
    );
  end if;
end
$$;

create table if not exists public.depot_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items (id),
  movement_type public.depot_movement_type not null,
  quantity_base numeric(14, 3) not null check (quantity_base <> 0),
  source_type public.movement_source_type,
  source_id uuid,
  description text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists depot_movements_item_idx on public.depot_movements (inventory_item_id);
create index if not exists depot_movements_created_idx on public.depot_movements (created_at desc);

alter table public.depot_movements enable row level security;

drop policy if exists depot_movements_select on public.depot_movements;
create policy depot_movements_select on public.depot_movements for select using (public.is_admin());
drop policy if exists depot_movements_insert on public.depot_movements;
create policy depot_movements_insert on public.depot_movements for insert with check (public.is_admin());
-- update/delete policy'si kasıtlı olarak yok: depo defteri de immutable'dır.

create or replace view public.v_depot_balances
with (security_invoker = true) as
select
  inventory_item_id,
  sum(quantity_base) as balance
from public.depot_movements
group by inventory_item_id;
