-- ---------------------------------------------------------------------------
-- Ana Depo RPC fonksiyonları.
-- ---------------------------------------------------------------------------

create or replace function public.fn_depot_stock_entry(
  p_lines jsonb, -- [{"inventory_item_id":..,"quantity_base":..}]
  p_description text default null
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için admin yetkisi gerekli' using errcode = '42501';
  end if;

  insert into public.depot_movements (
    inventory_item_id, movement_type, quantity_base, source_type, description, created_by
  )
  select (line ->> 'inventory_item_id')::uuid, 'purchase_in',
         (line ->> 'quantity_base')::numeric, 'manual', p_description, auth.uid()
  from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) as line
  where (line ->> 'quantity_base')::numeric > 0;

  insert into public.audit_logs (user_id, action, entity_type, new_value)
  values (auth.uid(), 'depot.stock_entry', 'depot_movements', jsonb_build_object('lines', p_lines));

  return jsonb_build_object('status', 'ok');
end;
$$;

-- Depodan bir etkinliğe stok gönderir. Depo fiziksel gerçek stoğu temsil
-- ettiğinden negatif stok politikası (warn_allow) burada geçerli değildir —
-- depoda yeterli miktar yoksa işlem her zaman reddedilir.
create or replace function public.fn_send_depot_to_event(
  p_event_id uuid,
  p_lines jsonb -- [{"inventory_item_id":..,"quantity_base":..}]
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_caravan_id uuid;
  v_blockers jsonb;
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için admin yetkisi gerekli' using errcode = '42501';
  end if;

  select caravan_id into v_caravan_id from public.events where id = p_event_id;
  if v_caravan_id is null then
    raise exception 'Etkinlik bulunamadı' using errcode = 'P0002';
  end if;

  create temporary table tmp_depot_send on commit drop as
  select
    (line ->> 'inventory_item_id')::uuid as inventory_item_id,
    (line ->> 'quantity_base')::numeric as requested,
    coalesce((
      select sum(quantity_base) from public.depot_movements dm
      where dm.inventory_item_id = (line ->> 'inventory_item_id')::uuid
    ), 0) as depot_balance
  from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) as line
  where (line ->> 'quantity_base')::numeric > 0;

  if exists (select 1 from tmp_depot_send where requested > depot_balance) then
    select jsonb_agg(jsonb_build_object(
      'inventory_item_id', inventory_item_id,
      'requested', requested,
      'depot_balance', depot_balance
    )) into v_blockers
    from tmp_depot_send where requested > depot_balance;

    return jsonb_build_object('status', 'insufficient_depot_stock', 'items', v_blockers);
  end if;

  insert into public.depot_movements (
    inventory_item_id, movement_type, quantity_base, source_type, source_id, created_by
  )
  select inventory_item_id, 'transfer_out_to_event', -requested, 'depot', p_event_id, auth.uid()
  from tmp_depot_send;

  insert into public.stock_movements (
    caravan_id, event_id, inventory_item_id, movement_type,
    quantity_base, source_type, source_id, description, created_by
  )
  select v_caravan_id, p_event_id, inventory_item_id, 'initial_load',
         requested, 'depot', p_event_id, 'Ana depodan gönderildi', auth.uid()
  from tmp_depot_send;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_value)
  values (auth.uid(), 'depot.send_to_event', 'events', p_event_id, jsonb_build_object('lines', p_lines));

  return jsonb_build_object('status', 'ok');
end;
$$;

-- Bir etkinlikten depoya stok iadesi: event tarafında zaten var olan negatif
-- hareketin yanında artık depo tarafında da pozitif bir karşılık yazılır
-- (önceden bu fonksiyon depoyu hiç beslemiyordu, hareket hiçbir yere
-- ulaşmıyordu).
create or replace function public.fn_return_to_depot(
  p_event_id uuid,
  p_lines jsonb, -- [{"inventory_item_id":..,"quantity_base":..,"description":..}]
  p_description text default null
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_caravan_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için admin yetkisi gerekli' using errcode = '42501';
  end if;

  select caravan_id into v_caravan_id from public.events where id = p_event_id;
  if v_caravan_id is null then
    raise exception 'Etkinlik bulunamadı' using errcode = 'P0002';
  end if;

  insert into public.stock_movements (
    caravan_id, event_id, inventory_item_id, movement_type,
    quantity_base, source_type, description, created_by
  )
  select v_caravan_id, p_event_id, (line ->> 'inventory_item_id')::uuid, 'return_to_depot',
         -(line ->> 'quantity_base')::numeric, 'depot',
         coalesce(line ->> 'description', p_description), auth.uid()
  from jsonb_array_elements(p_lines) as line
  where (line ->> 'quantity_base')::numeric > 0;

  insert into public.depot_movements (
    inventory_item_id, movement_type, quantity_base, source_type, source_id, description, created_by
  )
  select (line ->> 'inventory_item_id')::uuid, 'transfer_in_from_event',
         (line ->> 'quantity_base')::numeric, 'depot', p_event_id,
         coalesce(line ->> 'description', p_description), auth.uid()
  from jsonb_array_elements(p_lines) as line
  where (line ->> 'quantity_base')::numeric > 0;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_value)
  values (auth.uid(), 'stock.return_to_depot', 'events', p_event_id, jsonb_build_object('lines', p_lines));

  return jsonb_build_object('status', 'ok');
end;
$$;
