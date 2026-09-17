-- ---------------------------------------------------------------------------
-- Stok hareketi RPC fonksiyonları.
--
-- Hepsi `security invoker` olarak tanımlıdır: RLS zaten yalnızca aktif
-- adminlere tam CRUD yetkisi verdiğinden bu fonksiyonların ayrıcalık
-- yükseltmesine (DEFINER) ihtiyacı yoktur. Her fonksiyon yine de en başta
-- açık bir is_admin() kontrolü yapar; bu, RLS'in vereceği genel "izin
-- reddedildi" hatası yerine anlaşılır bir Türkçe hata mesajı döndürmek
-- içindir — güvenlik katmanı yine RLS'tir.
-- ---------------------------------------------------------------------------

create or replace function public.fn_load_initial_stock(
  p_event_id uuid,
  p_lines jsonb default '[]'::jsonb, -- [{"inventory_item_id":..,"quantity_base":..,"description":..}]
  p_copy_from_stock_count_id uuid default null
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

  if p_copy_from_stock_count_id is not null then
    insert into public.stock_movements (
      caravan_id, event_id, inventory_item_id, movement_type,
      quantity_base, source_type, source_id, description, created_by
    )
    select v_caravan_id, p_event_id, inventory_item_id, 'initial_load',
           physical_qty, 'stock_count', p_copy_from_stock_count_id,
           'Önceki sayımdan kopyalandı', auth.uid()
    from public.stock_count_lines
    where stock_count_id = p_copy_from_stock_count_id and physical_qty > 0;
  end if;

  insert into public.stock_movements (
    caravan_id, event_id, inventory_item_id, movement_type,
    quantity_base, source_type, description, created_by
  )
  select v_caravan_id, p_event_id, (line ->> 'inventory_item_id')::uuid, 'initial_load',
         (line ->> 'quantity_base')::numeric, 'manual', line ->> 'description', auth.uid()
  from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) as line
  where (line ->> 'quantity_base')::numeric > 0;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_value)
  values (
    auth.uid(), 'stock.initial_load', 'events', p_event_id,
    jsonb_build_object('lines', p_lines, 'copied_from', p_copy_from_stock_count_id)
  );

  return jsonb_build_object('status', 'ok', 'event_id', p_event_id);
end;
$$;

create or replace function public.fn_add_stock_entry(
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
  select v_caravan_id, p_event_id, (line ->> 'inventory_item_id')::uuid, 'additional_entry',
         (line ->> 'quantity_base')::numeric, 'manual',
         coalesce(line ->> 'description', p_description), auth.uid()
  from jsonb_array_elements(p_lines) as line
  where (line ->> 'quantity_base')::numeric > 0;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_value)
  values (auth.uid(), 'stock.add_entry', 'events', p_event_id, jsonb_build_object('lines', p_lines));

  return jsonb_build_object('status', 'ok');
end;
$$;

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
         -(line ->> 'quantity_base')::numeric, 'manual',
         coalesce(line ->> 'description', p_description), auth.uid()
  from jsonb_array_elements(p_lines) as line
  where (line ->> 'quantity_base')::numeric > 0;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_value)
  values (auth.uid(), 'stock.return_to_depot', 'events', p_event_id, jsonb_build_object('lines', p_lines));

  return jsonb_build_object('status', 'ok');
end;
$$;

create or replace function public.fn_transfer_stock(
  p_from_caravan_id uuid,
  p_to_caravan_id uuid,
  p_from_event_id uuid,
  p_to_event_id uuid,
  p_lines jsonb, -- [{"inventory_item_id":..,"quantity_base":..}]
  p_description text default null
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_transfer_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için admin yetkisi gerekli' using errcode = '42501';
  end if;
  if p_from_caravan_id = p_to_caravan_id then
    raise exception 'Kaynak ve hedef karavan aynı olamaz';
  end if;

  insert into public.stock_transfers (
    from_caravan_id, to_caravan_id, from_event_id, to_event_id, description, created_by
  ) values (
    p_from_caravan_id, p_to_caravan_id, p_from_event_id, p_to_event_id, p_description, auth.uid()
  ) returning id into v_transfer_id;

  insert into public.stock_movements (
    caravan_id, event_id, inventory_item_id, movement_type,
    quantity_base, source_type, source_id, description, created_by
  )
  select p_from_caravan_id, p_from_event_id, (line ->> 'inventory_item_id')::uuid, 'transfer_out',
         -(line ->> 'quantity_base')::numeric, 'stock_transfer', v_transfer_id, p_description, auth.uid()
  from jsonb_array_elements(p_lines) as line
  where (line ->> 'quantity_base')::numeric > 0;

  insert into public.stock_movements (
    caravan_id, event_id, inventory_item_id, movement_type,
    quantity_base, source_type, source_id, description, created_by
  )
  select p_to_caravan_id, p_to_event_id, (line ->> 'inventory_item_id')::uuid, 'transfer_in',
         (line ->> 'quantity_base')::numeric, 'stock_transfer', v_transfer_id, p_description, auth.uid()
  from jsonb_array_elements(p_lines) as line
  where (line ->> 'quantity_base')::numeric > 0;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_value)
  values (
    auth.uid(), 'stock.transfer', 'stock_transfers', v_transfer_id,
    jsonb_build_object('from_caravan_id', p_from_caravan_id, 'to_caravan_id', p_to_caravan_id, 'lines', p_lines)
  );

  return jsonb_build_object('status', 'ok', 'transfer_id', v_transfer_id);
end;
$$;

create or replace function public.fn_record_waste(
  p_event_id uuid,
  p_inventory_item_id uuid,
  p_waste_type public.waste_type,
  p_quantity_base numeric,
  p_reason text default null
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_caravan_id uuid;
  v_waste_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için admin yetkisi gerekli' using errcode = '42501';
  end if;
  if p_quantity_base <= 0 then
    raise exception 'Miktar 0''dan büyük olmalı';
  end if;

  select caravan_id into v_caravan_id from public.events where id = p_event_id;
  if v_caravan_id is null then
    raise exception 'Etkinlik bulunamadı' using errcode = 'P0002';
  end if;

  insert into public.waste_records (
    event_id, caravan_id, inventory_item_id, waste_type, quantity_base, reason, created_by
  ) values (
    p_event_id, v_caravan_id, p_inventory_item_id, p_waste_type, p_quantity_base, p_reason, auth.uid()
  ) returning id into v_waste_id;

  -- waste_type ve movement_type enum etiketleri (fire/complimentary/
  -- staff_meal/defective) birebir aynı isimlerde tanımlıdır, bu yüzden metin
  -- üzerinden güvenle cast edilebilir.
  insert into public.stock_movements (
    caravan_id, event_id, inventory_item_id, movement_type,
    quantity_base, source_type, source_id, description, created_by
  ) values (
    v_caravan_id, p_event_id, p_inventory_item_id, (p_waste_type::text)::public.movement_type,
    -p_quantity_base, 'waste_record', v_waste_id, p_reason, auth.uid()
  );

  return jsonb_build_object('status', 'ok', 'waste_id', v_waste_id);
end;
$$;

create or replace function public.fn_finalize_stock_count(
  p_stock_count_id uuid,
  p_lines jsonb -- [{"inventory_item_id":..,"physical_qty":..,"note":..}]
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count public.stock_counts%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için admin yetkisi gerekli' using errcode = '42501';
  end if;

  select * into v_count from public.stock_counts where id = p_stock_count_id for update;
  if not found then
    raise exception 'Sayım bulunamadı' using errcode = 'P0002';
  end if;
  if v_count.status = 'finalized' then
    return jsonb_build_object('status', 'already_finalized', 'stock_count_id', v_count.id);
  end if;

  delete from public.stock_count_lines where stock_count_id = p_stock_count_id;

  insert into public.stock_count_lines (
    stock_count_id, inventory_item_id, theoretical_qty, physical_qty, note
  )
  select
    p_stock_count_id,
    (line ->> 'inventory_item_id')::uuid,
    public.fn_theoretical_balance(v_count.event_id, v_count.caravan_id, (line ->> 'inventory_item_id')::uuid),
    (line ->> 'physical_qty')::numeric,
    line ->> 'note'
  from jsonb_array_elements(p_lines) as line;

  -- Defteri fiziksel gerçekliğe eşitleyen sayım düzeltmesi hareketleri.
  insert into public.stock_movements (
    caravan_id, event_id, inventory_item_id, movement_type,
    quantity_base, source_type, source_id, description, created_by
  )
  select v_count.caravan_id, v_count.event_id, inventory_item_id, 'count_adjustment',
         variance_qty, 'stock_count', p_stock_count_id, 'Fiziksel sayım düzeltmesi', auth.uid()
  from public.stock_count_lines
  where stock_count_id = p_stock_count_id and variance_qty <> 0;

  update public.stock_counts
    set status = 'finalized', counted_by = auth.uid(), counted_at = now(), updated_at = now()
    where id = p_stock_count_id;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_value)
  values (auth.uid(), 'stock_count.finalize', 'stock_counts', p_stock_count_id, p_lines);

  return jsonb_build_object('status', 'finalized', 'stock_count_id', p_stock_count_id);
end;
$$;
