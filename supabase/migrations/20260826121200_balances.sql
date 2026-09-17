-- Bir etkinlik + karavan + stok kalemi için teorik kalan stok: hareket
-- defterinin (stock_movements) işaretli toplamı. Stok bakiyesi hiçbir yerde
-- doğrudan bir kolonda tutulmaz.
create or replace function public.fn_theoretical_balance(
  p_event_id uuid,
  p_caravan_id uuid,
  p_inventory_item_id uuid
) returns numeric
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(sum(quantity_base), 0)
  from public.stock_movements
  where event_id = p_event_id
    and caravan_id = p_caravan_id
    and inventory_item_id = p_inventory_item_id;
$$;

-- security_invoker = true: view, sorguyu çalıştıran kullanıcının RLS
-- kısıtlarına tabi olur (view sahibinin değil) — PostgreSQL 15+ varsayılanı
-- tersi olduğundan burada açıkça belirtilmelidir.
create or replace view public.v_stock_balances
with (security_invoker = true) as
select
  event_id,
  caravan_id,
  inventory_item_id,
  sum(quantity_base) as balance
from public.stock_movements
group by event_id, caravan_id, inventory_item_id;
