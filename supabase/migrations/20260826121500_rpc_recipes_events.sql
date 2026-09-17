-- Bir ürün için yeni bir reçete versiyonu açar: mevcut aktif versiyonu
-- pasifleştirir (valid_to = now()) ve verilen kalemlerle yeni bir aktif
-- versiyon oluşturur. Eski versiyon ve satırları asla silinmez/değiştirilmez
-- — geçmiş satışlar hangi versiyonu kullandıklarını (sales_lines.recipe_version_id)
-- snapshot olarak sakladığından bozulmaz.
create or replace function public.fn_create_recipe_version(
  p_menu_product_id uuid,
  p_items jsonb, -- [{"inventory_item_id":..,"quantity":..}]
  p_notes text default null
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_next_version integer;
  v_new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için admin yetkisi gerekli' using errcode = '42501';
  end if;

  select coalesce(max(version_no), 0) + 1 into v_next_version
  from public.recipe_versions where menu_product_id = p_menu_product_id;

  update public.recipe_versions
    set is_active = false, valid_to = now()
    where menu_product_id = p_menu_product_id and is_active;

  insert into public.recipe_versions (menu_product_id, version_no, notes, created_by)
  values (p_menu_product_id, v_next_version, p_notes, auth.uid())
  returning id into v_new_id;

  insert into public.recipe_items (recipe_version_id, inventory_item_id, quantity)
  select v_new_id, (item ->> 'inventory_item_id')::uuid, (item ->> 'quantity')::numeric
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item
  where (item ->> 'quantity')::numeric > 0;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_value)
  values (
    auth.uid(), 'recipe_version.create', 'recipe_versions', v_new_id,
    jsonb_build_object('menu_product_id', p_menu_product_id, 'version_no', v_next_version, 'items', p_items)
  );

  return jsonb_build_object('status', 'ok', 'recipe_version_id', v_new_id, 'version_no', v_next_version);
end;
$$;

-- Bir etkinliği kapatır. Gün sonu sayımı kesinleştirilmeden etkinlik
-- kapatılamaz (şartname: "Etkinlik kapatılmadan önce satış, fire ve fiziksel
-- sayım özeti gösterilsin" — özetin gösterilmesi istemci tarafında, sayımın
-- kesinleşmiş olması zorunluluğu burada garanti edilir).
create or replace function public.fn_close_event(p_event_id uuid) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_event public.events%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için admin yetkisi gerekli' using errcode = '42501';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found then
    raise exception 'Etkinlik bulunamadı' using errcode = 'P0002';
  end if;

  if v_event.status = 'closed' then
    return jsonb_build_object('status', 'already_closed', 'event_id', p_event_id);
  end if;

  if not exists (
    select 1 from public.stock_counts
    where event_id = p_event_id and status = 'finalized'
  ) then
    raise exception 'Etkinlik kapatılmadan önce gün sonu sayımı kesinleştirilmelidir';
  end if;

  update public.events set status = 'closed', updated_at = now() where id = p_event_id;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_value)
  values (auth.uid(), 'event.close', 'events', p_event_id, jsonb_build_object('status', 'closed'));

  return jsonb_build_object('status', 'closed', 'event_id', p_event_id);
end;
$$;
