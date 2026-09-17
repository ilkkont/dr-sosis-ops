-- ---------------------------------------------------------------------------
-- Satış kesinleştirme ve düzeltme RPC fonksiyonları.
-- ---------------------------------------------------------------------------

-- Bir satış taslağını kesinleştirir: satış satırlarındaki her ürün için o
-- anda aktif olan reçete versiyonunu satıra "snapshot" olarak yazar, reçete
-- kalemlerine göre toplam malzeme tüketimini hesaplar, negatif stok
-- politikasını kontrol eder ve tek bir transaction içinde stok hareketlerini
-- oluşturup batch'i finalized yapar.
--
-- Dönüş değerleri:
--   {"status":"already_finalized", ...}   -> idempotent: zaten kesinleşmiş
--   {"status":"would_go_negative","items":[...]} -> onay gerekiyor (uyar modu)
--   {"status":"finalized", ...}           -> başarıyla tamamlandı
create or replace function public.fn_finalize_sales_batch(
  p_batch_id uuid,
  p_override_negative boolean default false
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_batch public.sales_batches%rowtype;
  v_policy text;
  v_blockers jsonb;
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için admin yetkisi gerekli' using errcode = '42501';
  end if;

  select * into v_batch from public.sales_batches where id = p_batch_id for update;
  if not found then
    raise exception 'Satış kaydı bulunamadı' using errcode = 'P0002';
  end if;

  if v_batch.status = 'finalized' then
    return jsonb_build_object('status', 'already_finalized', 'batch_id', v_batch.id);
  end if;

  if v_batch.status = 'corrected' then
    raise exception 'Bu satış kaydı düzeltilmiş, tekrar kesinleştirilemez';
  end if;

  select value #>> '{}' into v_policy from public.app_settings where key = 'negative_stock_policy';
  v_policy := coalesce(v_policy, 'warn_allow');

  -- Bu satır için henüz reçete versiyonu snapshot'ı alınmamışsa, o anda
  -- aktif olan versiyonu yaz.
  update public.sales_lines sl
    set recipe_version_id = rv.id
    from public.recipe_versions rv
    where sl.sales_batch_id = p_batch_id
      and sl.recipe_version_id is null
      and rv.menu_product_id = sl.menu_product_id
      and rv.is_active;

  create temporary table tmp_consumption on commit drop as
  select
    ri.inventory_item_id,
    sum(sl.quantity * ri.quantity) as needed,
    public.fn_theoretical_balance(v_batch.event_id, v_batch.caravan_id, ri.inventory_item_id) as current_balance
  from public.sales_lines sl
  join public.recipe_items ri on ri.recipe_version_id = sl.recipe_version_id
  where sl.sales_batch_id = p_batch_id and sl.quantity > 0
  group by ri.inventory_item_id;

  if v_policy = 'block' and exists (
    select 1 from tmp_consumption where current_balance - needed < 0
  ) then
    raise exception 'Yetersiz stok: bir veya daha fazla malzeme negatif stoğa düşer' using errcode = 'P0001';
  end if;

  if v_policy = 'warn_allow' and not p_override_negative and exists (
    select 1 from tmp_consumption where current_balance - needed < 0
  ) then
    select jsonb_agg(jsonb_build_object(
      'inventory_item_id', inventory_item_id,
      'current', current_balance,
      'needed', needed
    )) into v_blockers
    from tmp_consumption where current_balance - needed < 0;

    return jsonb_build_object('status', 'would_go_negative', 'items', v_blockers);
  end if;

  insert into public.stock_movements (
    caravan_id, event_id, inventory_item_id, movement_type,
    quantity_base, source_type, source_id, description, created_by
  )
  select v_batch.caravan_id, v_batch.event_id, inventory_item_id, 'recipe_consumption',
         -needed, 'sales_batch', v_batch.id, 'Satış tüketimi', auth.uid()
  from tmp_consumption
  where needed > 0;

  update public.sales_batches
    set status = 'finalized', finalized_by = auth.uid(), finalized_at = now(), updated_at = now()
    where id = p_batch_id;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_value)
  values (
    auth.uid(), 'sales_batch.finalize', 'sales_batches', p_batch_id,
    jsonb_build_object('override_negative', p_override_negative)
  );

  return jsonb_build_object('status', 'finalized', 'batch_id', p_batch_id);
end;
$$;

-- Kesinleşmiş bir satışı düzeltir: eski tüketimin tam tersini (pozitif)
-- yeni bir stock_movements kaydı olarak ekler (eski kayıtlar asla silinmez
-- veya değiştirilmez), eski batch'i 'corrected' işaretler, yeni satırlarla
-- yeni bir 'draft' batch açar ve onu kesinleştirir.
create or replace function public.fn_correct_sales_batch(
  p_old_batch_id uuid,
  p_new_lines jsonb, -- [{"menu_product_id":..,"quantity":..}]
  p_idempotency_key uuid,
  p_override_negative boolean default false
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_old public.sales_batches%rowtype;
  v_new_id uuid;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için admin yetkisi gerekli' using errcode = '42501';
  end if;

  select * into v_old from public.sales_batches where id = p_old_batch_id for update;
  if not found then
    raise exception 'Satış kaydı bulunamadı' using errcode = 'P0002';
  end if;
  if v_old.status <> 'finalized' then
    raise exception 'Yalnızca kesinleşmiş satış kayıtları düzeltilebilir';
  end if;

  insert into public.stock_movements (
    caravan_id, event_id, inventory_item_id, movement_type,
    quantity_base, source_type, source_id, description, created_by
  )
  select caravan_id, event_id, inventory_item_id, 'sale_reversal_adjustment',
         -quantity_base, 'sales_batch', v_old.id, 'Satış düzeltmesi: eski tüketimin tersi', auth.uid()
  from public.stock_movements
  where source_type = 'sales_batch' and source_id = v_old.id
    and movement_type = 'recipe_consumption';

  update public.sales_batches
    set status = 'corrected', updated_at = now()
    where id = v_old.id;

  insert into public.sales_batches (
    event_id, caravan_id, status, idempotency_key, supersedes_batch_id, created_by
  ) values (
    v_old.event_id, v_old.caravan_id, 'draft', p_idempotency_key, v_old.id, auth.uid()
  )
  on conflict (idempotency_key) do update set updated_at = now()
  returning id into v_new_id;

  insert into public.sales_lines (sales_batch_id, menu_product_id, quantity)
  select v_new_id, (line ->> 'menu_product_id')::uuid, (line ->> 'quantity')::integer
  from jsonb_array_elements(p_new_lines) as line
  on conflict (sales_batch_id, menu_product_id) do update set quantity = excluded.quantity;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
  values (
    auth.uid(), 'sales_batch.correct', 'sales_batches', v_old.id,
    jsonb_build_object('old_batch_id', v_old.id), jsonb_build_object('new_batch_id', v_new_id)
  );

  v_result := public.fn_finalize_sales_batch(v_new_id, p_override_negative);
  return v_result || jsonb_build_object('old_batch_id', v_old.id, 'new_batch_id', v_new_id);
end;
$$;
