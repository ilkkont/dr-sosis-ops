-- ---------------------------------------------------------------------------
-- Kalem kataloğu v2: yeni kalem listesi, birim etiketleri, yeni kategoriler.
-- Hiçbir kayıt silinmez: aynı anlamdaki mevcut kalemler yeniden adlandırılır
-- (tarifler ve geçmiş bozulmasın), listede olmayanlar pasifleştirilir.
-- Bu dosya güvenle tekrar çalıştırılabilir (idempotent). Karşılaştırmalar
-- isim üzerinde birebir (=) yapılır, kategoriler sort_order ile bulunur
-- (Türkçe harflerde lower() locale'e bağlı davranabildiği için).
--
-- Önkoşul: 20261018090000_categories_units.sql çalıştırılmış olmalı.
-- ---------------------------------------------------------------------------

-- 1) Yeniden adlandırmalar (hedef isim yoksa) --------------------------------
do $$
declare
  r record;
begin
  for r in select * from (values
    ('Hot Dog Ekmek', 'Ekmek'),
    ('Sosis', 'Sade Sosis'),
    ('Coca-Cola', 'Orjinal Kola'),
    ('Coca-Cola Zero', 'Zero Kola'),
    ('Sriracha', 'Acı Sos'),
    ('Islak Temizlik Bezi', 'Islak Mendil'),
    ('Rulo Peçete', 'Rulo Havlu'),
    ('Tekli Patates Kutusu', 'Patates Küveti'),
    ('Menü Kutusu', 'Menü Kutusu - İç')
  ) as v(old_name, new_name)
  loop
    if exists (select 1 from public.inventory_items where name = r.old_name)
       and not exists (select 1 from public.inventory_items where name = r.new_name) then
      update public.inventory_items set name = r.new_name where name = r.old_name;
    end if;
  end loop;

  for r in select * from (values
    ('Coca-Cola', 'Orjinal Kola'),
    ('Coca-Cola Zero', 'Zero Kola')
  ) as v(old_name, new_name)
  loop
    if exists (select 1 from public.menu_products where name = r.old_name)
       and not exists (select 1 from public.menu_products where name = r.new_name) then
      update public.menu_products set name = r.new_name where name = r.old_name;
    end if;
  end loop;
end
$$;

-- 2) Listede olmayan kalemleri/ürünleri pasifleştir ---------------------------
update public.inventory_items set is_active = false
where name in ('Pet Su', 'Cappy', 'Ice Tea', 'Bardak', 'Tekli Kutu');

update public.menu_products set is_active = false
where name in ('Pet Su', 'Cappy', 'Ice Tea');

-- 3) Yeni kalemler -----------------------------------------------------------
-- (isim, kategori sort_order, unit_type, display_input_unit, unit_label)
insert into public.inventory_items
  (name, category, category_id, unit_type, display_input_unit, unit_label, critical_level)
select v.name, 'other'::public.inventory_category, c.id,
       v.unit_type::public.unit_type, v.display_input_unit::public.display_input_unit,
       v.unit_label, 0
from (values
  -- Ekipman (10)
  ('Actifry', 10, 'count', 'unit', 'adet'),
  ('Actifry Tavası', 10, 'count', 'unit', 'adet'),
  ('Actifry Döndürgeç', 10, 'count', 'unit', 'adet'),
  ('Roller', 10, 'count', 'unit', 'adet'),
  ('Izgara', 10, 'count', 'unit', 'adet'),
  ('Benmari', 10, 'count', 'unit', 'adet'),
  ('Fritöz', 10, 'count', 'unit', 'adet'),
  -- Sosis - Sarf (20)
  ('Donuk Ekmek', 20, 'count', 'unit', 'adet'),
  -- 90gr Sosis (30) / 75gr Sosis (40)
  ('90gr Acılı Sosis', 30, 'count', 'unit', 'adet'),
  ('90gr Sade Sosis', 30, 'count', 'unit', 'adet'),
  ('75gr Acılı Sosis', 40, 'count', 'unit', 'adet'),
  ('75gr Sade Sosis', 40, 'count', 'unit', 'adet'),
  -- Patates (50)
  ('Menü Kutusu - Dış', 50, 'count', 'unit', 'koli'),
  -- Paketleme (70)
  ('Sleepy', 70, 'count', 'unit', 'paket'),
  ('Paket Islak Mendil', 70, 'count', 'unit', 'paket'),
  -- İçecekler (80)
  ('Bardak Su', 80, 'count', 'unit', 'adet'),
  ('Fuse Tea Mango', 80, 'count', 'unit', 'adet'),
  ('Fuse Tea Şeftali', 80, 'count', 'unit', 'adet'),
  ('Fuse Tea Limon', 80, 'count', 'unit', 'adet'),
  ('Karton Dimes - Kayısı', 80, 'count', 'unit', 'adet'),
  ('Karton Dimes - Vişne', 80, 'count', 'unit', 'adet'),
  ('Karton Dimes - Karışık', 80, 'count', 'unit', 'adet'),
  ('Dragon', 80, 'count', 'unit', 'adet'),
  ('Safari', 80, 'count', 'unit', 'adet'),
  -- Mısır (90)
  ('Mısır', 90, 'weight', 'gram', null),
  ('Mısır Tuzu', 90, 'weight', 'gram', null),
  ('Mısır Kutusu', 90, 'count', 'unit', 'adet'),
  ('Mısır Yağı', 90, 'count', 'unit', 'litre'),
  ('Tekli Paket Tuz', 90, 'count', 'unit', 'kutu'),
  ('Mısır Küreği', 90, 'count', 'unit', 'adet'),
  ('Yağ Fişeği', 90, 'count', 'unit', 'adet'),
  -- Ekstralar (100)
  ('Ekmek Bıçağı', 100, 'count', 'unit', 'adet'),
  ('Sosis Bıçağı', 100, 'count', 'unit', 'adet'),
  ('Cheddar Kepçesi', 100, 'count', 'unit', 'adet'),
  ('Cheddar Çırpıcı', 100, 'count', 'unit', 'adet'),
  ('Maşa', 100, 'count', 'unit', 'adet'),
  ('Süt', 100, 'count', 'unit', 'kutu'),
  ('Küçük Fişek', 100, 'count', 'unit', 'adet'),
  ('Büyük Fişek', 100, 'count', 'unit', 'adet'),
  ('Kahverengi Küvet Kutu', 100, 'count', 'unit', 'adet'),
  ('Fiyat Tabelası', 100, 'count', 'unit', 'adet')
) as v(name, cat_order, unit_type, display_input_unit, unit_label)
join public.inventory_categories c on c.sort_order = v.cat_order
where not exists (select 1 from public.inventory_items ii where ii.name = v.name);

-- 4) Mevcut kalemlerin kategori ve birim etiketleri --------------------------
update public.inventory_items ii
set category_id = c.id
from public.inventory_categories c
where c.sort_order = 50 and ii.name = 'Menü Kutusu - İç';

update public.inventory_items ii
set unit_label = v.unit_label
from (values
  ('Çıtır Soğan', 'paket'),
  ('Cheddar', 'teneke'),
  ('Turşu', 'kova'),
  ('Ketçap', 'adet'),
  ('Mayonez', 'adet'),
  ('Hardal', 'adet'),
  ('Barbekü', 'adet'),
  ('Trüflü Mayonez', 'adet'),
  ('Acı Sos', 'adet'),
  ('Ekmek', 'adet'),
  ('Sade Sosis', 'adet'),
  ('Acılı Sosis', 'adet'),
  ('Mızrak', 'kutu'),
  ('Patates Küveti', 'adet'),
  ('Menü Kutusu - İç', 'koli'),
  ('Servis Kağıdı', 'koli'),
  ('Islak Mendil', 'koli'),
  ('Kare Peçete', 'koli'),
  ('Rulo Havlu', 'adet'),
  ('Streç', 'adet'),
  ('Eldiven', 'paket'),
  ('Çöp Poşeti', 'rulo'),
  ('Şişe Su', 'adet')
) as v(name, unit_label)
where ii.name = v.name;

-- Yağ litre cinsinden sayılır: henüz hiçbir hareket/tarifte kullanılmadıysa
-- gram-tipinden sayma-tipine (litre) çevrilir.
update public.inventory_items ii
set unit_type = 'count', display_input_unit = 'unit', unit_label = 'litre'
where ii.name = 'Yağ'
  and ii.unit_type = 'weight'
  and not exists (select 1 from public.stock_movements m where m.inventory_item_id = ii.id)
  and not exists (select 1 from public.depot_movements m where m.inventory_item_id = ii.id)
  and not exists (select 1 from public.recipe_items r where r.inventory_item_id = ii.id);

-- 5) Satılan yeni içecekler için menü ürünü + 1:1 reçete ----------------------
insert into public.menu_products (name, category, display_order)
select v.name, 'drink'::public.menu_category, v.display_order
from (values
  ('Bardak Su', 27),
  ('Fuse Tea Mango', 28),
  ('Fuse Tea Şeftali', 29),
  ('Fuse Tea Limon', 30),
  ('Karton Dimes - Kayısı', 31),
  ('Karton Dimes - Vişne', 32),
  ('Karton Dimes - Karışık', 33),
  ('Dragon', 34),
  ('Safari', 35)
) as v(name, display_order)
where not exists (select 1 from public.menu_products mp where mp.name = v.name);

update public.menu_products mp
set linked_drink_item_id = ii.id
from public.inventory_items ii
where mp.category = 'drink'
  and mp.name = ii.name
  and mp.linked_drink_item_id is null
  and mp.name in (
    'Bardak Su', 'Fuse Tea Mango', 'Fuse Tea Şeftali', 'Fuse Tea Limon',
    'Karton Dimes - Kayısı', 'Karton Dimes - Vişne', 'Karton Dimes - Karışık',
    'Dragon', 'Safari'
  );

with rv as (
  insert into public.recipe_versions (menu_product_id, version_no)
  select mp.id, 1 from public.menu_products mp
  where mp.name in (
    'Bardak Su', 'Fuse Tea Mango', 'Fuse Tea Şeftali', 'Fuse Tea Limon',
    'Karton Dimes - Kayısı', 'Karton Dimes - Vişne', 'Karton Dimes - Karışık',
    'Dragon', 'Safari'
  )
    and not exists (select 1 from public.recipe_versions where menu_product_id = mp.id)
  returning id, menu_product_id
)
insert into public.recipe_items (recipe_version_id, inventory_item_id, quantity)
select rv.id, ii.id, 1
from rv
join public.menu_products mp on mp.id = rv.menu_product_id
join public.inventory_items ii on ii.name = mp.name;
