-- ---------------------------------------------------------------------------
-- Katalog güncellemeleri: Su varyantları, Paketleme kalemlerinin açılması,
-- Patates kategorisine ek kalemler. Hiçbir mevcut kayıt silinmez; eskiyen
-- "Su" kalemi/ürünü yalnızca pasifleştirilir (geçmiş satışlar bozulmaz).
-- Tüm insert'ler "not exists" ile korunur — bu dosya güvenle tekrar
-- çalıştırılabilir (idempotent).
--
-- NOT: Bu migration seed.sql'in ZATEN çalıştırılmış olduğu bir veritabanını
-- varsayar (temel "Su" kaydını ve menu_products'ı günceller). Sıfırdan yeni
-- bir Supabase projesi kurulumunda önce tüm migration'lar + seed.sql, en son
-- da bu dosya çalıştırılmalıdır.
-- ---------------------------------------------------------------------------

update public.inventory_items set is_active = false where name = 'Su' and category = 'drink';
update public.menu_products set is_active = false where name = 'Su' and category = 'drink';

insert into public.inventory_items (name, category, unit_type, display_input_unit, critical_level)
select v.name, v.category::public.inventory_category, v.unit_type::public.unit_type,
       v.display_input_unit::public.display_input_unit, v.critical_level::numeric
from (values
  ('Pet Su', 'drink', 'count', 'unit', 24),
  ('Şişe Su', 'drink', 'count', 'unit', 24),
  ('Eldiven', 'packaging', 'count', 'unit', 100),
  ('Islak Temizlik Bezi', 'packaging', 'count', 'unit', 100),
  ('Kare Peçete', 'packaging', 'count', 'unit', 200),
  ('Rulo Peçete', 'packaging', 'count', 'unit', 20),
  ('Streç', 'packaging', 'count', 'unit', 10),
  ('Çöp Poşeti', 'packaging', 'count', 'unit', 50),
  ('Bardak', 'packaging', 'count', 'unit', 100),
  ('Servis Kağıdı', 'packaging', 'count', 'unit', 200),
  ('Tekli Kutu', 'packaging', 'count', 'unit', 100),
  ('Menü Kutusu', 'packaging', 'count', 'unit', 100),
  ('Mızrak', 'produce', 'count', 'unit', 100),
  ('Tekli Patates Kutusu', 'produce', 'count', 'unit', 100),
  ('Yağ', 'produce', 'weight', 'gram', 2000),
  ('Tuz', 'produce', 'weight', 'gram', 500)
) as v(name, category, unit_type, display_input_unit, critical_level)
where not exists (select 1 from public.inventory_items ii where ii.name = v.name);

insert into public.menu_products (name, category, display_order)
select v.name, v.category::public.menu_category, v.display_order::integer
from (values
  ('Pet Su', 'drink', 25),
  ('Şişe Su', 'drink', 26)
) as v(name, category, display_order)
where not exists (select 1 from public.menu_products mp where mp.name = v.name);

update public.menu_products mp
set linked_drink_item_id = ii.id
from public.inventory_items ii
where mp.category = 'drink' and lower(ii.name) = lower(mp.name)
  and mp.name in ('Pet Su', 'Şişe Su')
  and mp.linked_drink_item_id is null;

with rv as (
  insert into public.recipe_versions (menu_product_id, version_no)
  select mp.id, 1 from public.menu_products mp
  where mp.name in ('Pet Su', 'Şişe Su')
    and not exists (select 1 from public.recipe_versions where menu_product_id = mp.id)
  returning id, menu_product_id
)
insert into public.recipe_items (recipe_version_id, inventory_item_id, quantity)
select rv.id, ii.id, 1
from rv
join public.menu_products mp on mp.id = rv.menu_product_id
join public.inventory_items ii on lower(ii.name) = lower(mp.name);
