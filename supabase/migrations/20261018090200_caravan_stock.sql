-- ---------------------------------------------------------------------------
-- Karavan stokları: her karavanın etkinlikten bağımsız, manuel yönetilen
-- kalıcı stoğu. stock_movements / depot_movements ile aynı immutable-ledger
-- deseni — bakiye hiçbir zaman bir kolonda tutulmaz, SUM(quantity_base) ile
-- hesaplanır (bkz. v_caravan_stock_balances). Bu dosya tekrar çalıştırılabilir.
-- ---------------------------------------------------------------------------

create table if not exists public.caravan_stock_movements (
  id uuid primary key default gen_random_uuid(),
  caravan_id uuid not null references public.caravans (id),
  inventory_item_id uuid not null references public.inventory_items (id),
  quantity_base numeric(14, 3) not null check (quantity_base <> 0),
  description text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists caravan_stock_movements_balance_idx
  on public.caravan_stock_movements (caravan_id, inventory_item_id);
create index if not exists caravan_stock_movements_created_idx
  on public.caravan_stock_movements (created_at desc);

alter table public.caravan_stock_movements enable row level security;

drop policy if exists caravan_stock_movements_select on public.caravan_stock_movements;
create policy caravan_stock_movements_select on public.caravan_stock_movements
  for select using (public.is_admin());
drop policy if exists caravan_stock_movements_insert on public.caravan_stock_movements;
create policy caravan_stock_movements_insert on public.caravan_stock_movements
  for insert with check (public.is_admin());
-- update/delete policy'si kasıtlı olarak yok: karavan stok defteri immutable'dır.

create or replace view public.v_caravan_stock_balances
with (security_invoker = true) as
select
  caravan_id,
  inventory_item_id,
  sum(quantity_base) as balance
from public.caravan_stock_movements
group by caravan_id, inventory_item_id;

-- Bir karavanın stoğunu verilen toplamlara eşitler. Güncel bakiye sunucuda
-- okunup delta orada hesaplanır (istemci delta'sına güvenilmez); delta
-- sıfırsa satır eklenmez.
create or replace function public.fn_set_caravan_stock(
  p_caravan_id uuid,
  p_lines jsonb, -- [{"inventory_item_id":..,"new_total_base":..}]
  p_description text default null
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_changed integer;
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için admin yetkisi gerekli' using errcode = '42501';
  end if;

  if not exists (select 1 from public.caravans where id = p_caravan_id) then
    raise exception 'Karavan bulunamadı' using errcode = 'P0002';
  end if;

  with wanted as (
    select (line ->> 'inventory_item_id')::uuid as inventory_item_id,
           (line ->> 'new_total_base')::numeric as new_total
    from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) as line
  ),
  deltas as (
    select w.inventory_item_id,
           w.new_total - coalesce((
             select sum(m.quantity_base) from public.caravan_stock_movements m
             where m.caravan_id = p_caravan_id and m.inventory_item_id = w.inventory_item_id
           ), 0) as delta
    from wanted w
    where w.new_total >= 0
  ),
  ins as (
    insert into public.caravan_stock_movements (
      caravan_id, inventory_item_id, quantity_base, description, created_by
    )
    select p_caravan_id, d.inventory_item_id, d.delta, p_description, auth.uid()
    from deltas d
    where d.delta <> 0
    returning 1
  )
  select count(*) into v_changed from ins;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_value)
  values (
    auth.uid(), 'caravan_stock.set', 'caravans', p_caravan_id,
    jsonb_build_object('lines', p_lines, 'changed', v_changed)
  );

  return jsonb_build_object('status', 'ok', 'changed', v_changed);
end;
$$;
