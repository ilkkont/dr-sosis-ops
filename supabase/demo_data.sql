-- ---------------------------------------------------------------------------
-- Dr.Sosis Operasyon Paneli — OPSİYONEL temel demo verisi.
--
-- supabase/migrations/*.sql ve supabase/seed.sql çalıştırıldıktan SONRA,
-- yalnızca uygulamayı dolu bir veriyle görmek isterseniz bu dosyayı bir kez
-- çalıştırın. Zorunlu değildir ve production'da çalıştırılması önerilmez.
--
-- fn_* RPC fonksiyonları auth.uid() (oturum açmış admin) gerektirdiğinden,
-- bu script RPC'leri çağırmaz; aynı iş mantığını (reçeteye göre tüketim,
-- teorik/fiziksel fark) doğrudan SQL ile, tutarlı bir şekilde uygular.
-- ---------------------------------------------------------------------------

do $$
declare
  v_caravan_id uuid;
  v_event_id uuid;
  v_batch_id uuid;
  v_count_id uuid;
begin
  select id into v_caravan_id from public.caravans where name = 'Karavan 1';

  insert into public.events (
    event_date, name, location, caravan_id, start_time, end_time,
    expected_attendance, responsible_person, status
  ) values (
    current_date - 1,
    'Demo Festivali',
    'İstanbul, Maçka Parkı',
    v_caravan_id,
    (current_date - 1 + time '17:00') at time zone 'Europe/Istanbul',
    (current_date - 1 + time '23:00') at time zone 'Europe/Istanbul',
    500,
    'Demo Sorumlusu',
    'closed'
  ) returning id into v_event_id;

  -- Başlangıç stok yüklemesi (bol miktarda, tüketimi rahatça karşılasın)
  insert into public.stock_movements (
    caravan_id, event_id, inventory_item_id, movement_type, quantity_base,
    source_type, description
  )
  select v_caravan_id, v_event_id, ii.id, 'initial_load', v.qty, 'manual', 'Demo başlangıç stoku'
  from (values
    ('Hot Dog Ekmek', 200::numeric),
    ('Sosis', 150),
    ('Acılı Sosis', 80),
    ('Paketleme', 200),
    ('Barbekü', 3000),
    ('Mayonez', 3000),
    ('Ketçap', 3000),
    ('Çıtır Soğan', 3000),
    ('Turşu', 4000),
    ('Hardal', 2000),
    ('Cheddar', 3000),
    ('Trüflü Mayonez', 2000),
    ('Patates', 40),
    ('Coca-Cola', 100),
    ('Coca-Cola Zero', 50),
    ('Ayran', 50)
  ) as v(item_name, qty)
  join public.inventory_items ii on ii.name = v.item_name;

  -- Kesinleşmiş bir satış partisi
  insert into public.sales_batches (
    event_id, caravan_id, status, idempotency_key, finalized_at
  ) values (
    v_event_id, v_caravan_id, 'finalized', gen_random_uuid(), now()
  ) returning id into v_batch_id;

  insert into public.sales_lines (sales_batch_id, menu_product_id, recipe_version_id, quantity)
  select v_batch_id, mp.id, rv.id, v.qty
  from (values
    ('Klasik Frankfurter', 35),
    ('Cheddarlı Frankfurter', 20),
    ('Acılı Frankfurter', 15),
    ('Klasik Frankfurter + Patates', 18),
    ('Coca-Cola', 40),
    ('Ayran', 12)
  ) as v(product_name, qty)
  join public.menu_products mp on mp.name = v.product_name
  join public.recipe_versions rv on rv.menu_product_id = mp.id and rv.is_active;

  -- Reçeteye göre toplam malzeme tüketimi (satış tüketimi hareketleri)
  insert into public.stock_movements (
    caravan_id, event_id, inventory_item_id, movement_type, quantity_base,
    source_type, source_id, description
  )
  select v_caravan_id, v_event_id, ri.inventory_item_id, 'recipe_consumption',
         -sum(sl.quantity * ri.quantity), 'sales_batch', v_batch_id, 'Demo satış tüketimi'
  from public.sales_lines sl
  join public.recipe_items ri on ri.recipe_version_id = sl.recipe_version_id
  where sl.sales_batch_id = v_batch_id
  group by ri.inventory_item_id;

  -- Bir fire kaydı (demo amaçlı)
  insert into public.waste_records (event_id, caravan_id, inventory_item_id, waste_type, quantity_base, reason)
  select v_event_id, v_caravan_id, ii.id, 'fire', 3, 'Demo: yere düşen ekmekler'
  from public.inventory_items ii where ii.name = 'Hot Dog Ekmek';

  insert into public.stock_movements (
    caravan_id, event_id, inventory_item_id, movement_type, quantity_base,
    source_type, description
  )
  select v_caravan_id, v_event_id, ii.id, 'fire', -3, 'manual', 'Demo: yere düşen ekmekler'
  from public.inventory_items ii where ii.name = 'Hot Dog Ekmek';

  -- Kesinleşmiş gün sonu sayımı: çoğu kalemde fark yok, Hot Dog Ekmek'te
  -- küçük bir fark (fire dışı kayıp) göstermek için kasıtlı 2 birim eksik.
  insert into public.stock_counts (event_id, caravan_id, status, counted_at)
  values (v_event_id, v_caravan_id, 'finalized', now())
  returning id into v_count_id;

  insert into public.stock_count_lines (stock_count_id, inventory_item_id, theoretical_qty, physical_qty, note)
  select
    v_count_id,
    ii.id,
    public.fn_theoretical_balance(v_event_id, v_caravan_id, ii.id),
    case
      when ii.name = 'Hot Dog Ekmek' then public.fn_theoretical_balance(v_event_id, v_caravan_id, ii.id) - 2
      else public.fn_theoretical_balance(v_event_id, v_caravan_id, ii.id)
    end,
    case when ii.name = 'Hot Dog Ekmek' then 'Demo: küçük sayım farkı' else null end
  from public.inventory_items ii
  where ii.is_active;

  insert into public.stock_movements (
    caravan_id, event_id, inventory_item_id, movement_type, quantity_base,
    source_type, source_id, description
  )
  select v_caravan_id, v_event_id, inventory_item_id, 'count_adjustment', variance_qty,
         'stock_count', v_count_id, 'Demo sayım düzeltmesi'
  from public.stock_count_lines
  where stock_count_id = v_count_id and variance_qty <> 0;
end $$;
