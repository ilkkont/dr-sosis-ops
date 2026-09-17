-- ---------------------------------------------------------------------------
-- Dr.Sosis Operasyon Paneli — zorunlu başlangıç verisi (seed).
--
-- Bu script "supabase db reset" veya "supabase db push --include-seed" ile
-- migration'lardan SONRA çalıştırılır. RLS politikalarını (is_admin())
-- bilerek atlar: seed işlemi henüz hiçbir admin oturumu yokken, migration
-- rolüyle (RLS bypass eden superuser/postgres bağlantısı) çalışır. Bu yüzden
-- burada RPC fonksiyonları yerine doğrudan INSERT kullanılır.
--
-- Demo amaçlı örnek etkinlik/satış verisi burada YOKTUR — bkz. supabase/demo_data.sql.
-- ---------------------------------------------------------------------------

-- Karavanlar --------------------------------------------------------------
insert into public.caravans (name, status) values
  ('Karavan 1', 'active'),
  ('Karavan 2', 'active'),
  ('Karavan 3', 'active'),
  ('Karavan 4', 'active'),
  ('Karavan 5', 'active');

-- Stok kalemleri: adet bazlı -------------------------------------------------
insert into public.inventory_items (name, category, unit_type, display_input_unit, critical_level) values
  ('Hot Dog Ekmek', 'bread', 'count', 'unit', 50),
  ('Sosis', 'sausage', 'count', 'unit', 50),
  ('Acılı Sosis', 'sausage', 'count', 'unit', 30),
  ('Coca-Cola', 'drink', 'count', 'unit', 24),
  ('Coca-Cola Zero', 'drink', 'count', 'unit', 24),
  ('Fanta', 'drink', 'count', 'unit', 24),
  ('Sprite', 'drink', 'count', 'unit', 24),
  ('Cappy', 'drink', 'count', 'unit', 24),
  ('Ice Tea', 'drink', 'count', 'unit', 24),
  ('Ayran', 'drink', 'count', 'unit', 24),
  ('Su', 'drink', 'count', 'unit', 24),
  ('Soda', 'drink', 'count', 'unit', 24),
  ('Paketleme', 'packaging', 'count', 'unit', 50);

-- Stok kalemleri: gram bazlı --------------------------------------------------
insert into public.inventory_items (name, category, unit_type, display_input_unit, critical_level) values
  ('Cheddar', 'cheese', 'weight', 'gram', 500),
  ('Trüflü Mayonez', 'sauce', 'weight', 'gram', 500),
  ('Barbekü', 'sauce', 'weight', 'gram', 500),
  ('Mayonez', 'sauce', 'weight', 'gram', 500),
  ('Ketçap', 'sauce', 'weight', 'gram', 500),
  ('Çıtır Soğan', 'topping', 'weight', 'gram', 500),
  ('Turşu', 'topping', 'weight', 'gram', 500),
  ('Hardal', 'sauce', 'weight', 'gram', 500),
  -- Sriracha: hiçbir reçeteye varsayılan olarak eklenmez, yönetici isterse
  -- reçete editöründen gramajla ekleyebilir.
  ('Sriracha', 'sauce', 'weight', 'gram', 300);

-- Patates: yönetilebilir birim sistemi (varsayılan porsiyon, kg girişi 1kg=5 porsiyon) ----
insert into public.inventory_items (name, category, unit_type, display_input_unit, portion_kg_factor, critical_level) values
  ('Patates', 'produce', 'portion', 'portion', 5, 20);

-- Menü ürünleri ---------------------------------------------------------------
insert into public.menu_products (name, category, display_order) values
  ('Klasik Frankfurter', 'hotdog', 1),
  ('Cheddarlı Frankfurter', 'hotdog', 2),
  ('Trüflü Frankfurter', 'hotdog', 3),
  ('Acılı Frankfurter', 'hotdog', 4),
  ('Acılı Trüflü Frankfurter', 'hotdog', 5),
  ('Acılı Cheddarlı Frankfurter', 'hotdog', 6),
  ('Klasik Frankfurter + Patates', 'hotdog_potato', 7),
  ('Cheddarlı Frankfurter + Patates', 'hotdog_potato', 8),
  ('Trüflü Frankfurter + Patates', 'hotdog_potato', 9),
  ('Acılı Frankfurter + Patates', 'hotdog_potato', 10),
  ('Acılı Trüflü Frankfurter + Patates', 'hotdog_potato', 11),
  ('Acılı Cheddarlı Frankfurter + Patates', 'hotdog_potato', 12),
  ('Peynir Çubukları', 'side', 13),
  ('Soğan Halkası', 'side', 14),
  ('Çıtır Tavuk', 'side', 15),
  ('Coca-Cola', 'drink', 16),
  ('Coca-Cola Zero', 'drink', 17),
  ('Fanta', 'drink', 18),
  ('Sprite', 'drink', 19),
  ('Cappy', 'drink', 20),
  ('Ice Tea', 'drink', 21),
  ('Ayran', 'drink', 22),
  ('Su', 'drink', 23),
  ('Soda', 'drink', 24);

-- İçecek menü ürünlerini bilgi amaçlı olarak aynı isimli stok kalemine bağla.
update public.menu_products mp
set linked_drink_item_id = ii.id
from public.inventory_items ii
where mp.category = 'drink' and lower(ii.name) = lower(mp.name);

-- Hot dog ve patatesli hot dog reçeteleri (versiyon 1) -------------------------
-- Temel reçete: 1 Hot Dog Ekmek, 1 Paketleme, 11g Barbekü, 10g Mayonez,
-- 10g Ketçap, 10g Çıtır Soğan, 20g Turşu, 9g Hardal + ürüne göre sosis/
-- cheddar/trüflü mayonez/patates modifiyeleri.
do $$
declare
  base_items jsonb := '[
    {"name": "Hot Dog Ekmek", "qty": 1},
    {"name": "Paketleme", "qty": 1},
    {"name": "Barbekü", "qty": 11},
    {"name": "Mayonez", "qty": 10},
    {"name": "Ketçap", "qty": 10},
    {"name": "Çıtır Soğan", "qty": 10},
    {"name": "Turşu", "qty": 20},
    {"name": "Hardal", "qty": 9}
  ]'::jsonb;
  products jsonb := '[
    {"name": "Klasik Frankfurter", "spicy": false, "cheddar": false, "truffle": false, "potato": false},
    {"name": "Cheddarlı Frankfurter", "spicy": false, "cheddar": true, "truffle": false, "potato": false},
    {"name": "Trüflü Frankfurter", "spicy": false, "cheddar": false, "truffle": true, "potato": false},
    {"name": "Acılı Frankfurter", "spicy": true, "cheddar": false, "truffle": false, "potato": false},
    {"name": "Acılı Trüflü Frankfurter", "spicy": true, "cheddar": false, "truffle": true, "potato": false},
    {"name": "Acılı Cheddarlı Frankfurter", "spicy": true, "cheddar": true, "truffle": false, "potato": false},
    {"name": "Klasik Frankfurter + Patates", "spicy": false, "cheddar": false, "truffle": false, "potato": true},
    {"name": "Cheddarlı Frankfurter + Patates", "spicy": false, "cheddar": true, "truffle": false, "potato": true},
    {"name": "Trüflü Frankfurter + Patates", "spicy": false, "cheddar": false, "truffle": true, "potato": true},
    {"name": "Acılı Frankfurter + Patates", "spicy": true, "cheddar": false, "truffle": false, "potato": true},
    {"name": "Acılı Trüflü Frankfurter + Patates", "spicy": true, "cheddar": false, "truffle": true, "potato": true},
    {"name": "Acılı Cheddarlı Frankfurter + Patates", "spicy": true, "cheddar": true, "truffle": false, "potato": true}
  ]'::jsonb;
  v_product jsonb;
  v_item jsonb;
  v_rv_id uuid;
begin
  for v_product in select jsonb_array_elements(products) loop
    insert into public.recipe_versions (menu_product_id, version_no)
    select id, 1 from public.menu_products where name = v_product ->> 'name'
    returning id into v_rv_id;

    for v_item in select jsonb_array_elements(base_items) loop
      insert into public.recipe_items (recipe_version_id, inventory_item_id, quantity)
      select v_rv_id, ii.id, (v_item ->> 'qty')::numeric
      from public.inventory_items ii
      where ii.name = v_item ->> 'name';
    end loop;

    insert into public.recipe_items (recipe_version_id, inventory_item_id, quantity)
    select v_rv_id, ii.id, 1
    from public.inventory_items ii
    where ii.name = case when (v_product ->> 'spicy')::boolean then 'Acılı Sosis' else 'Sosis' end;

    if (v_product ->> 'cheddar')::boolean then
      insert into public.recipe_items (recipe_version_id, inventory_item_id, quantity)
      select v_rv_id, ii.id, 25 from public.inventory_items ii where ii.name = 'Cheddar';
    end if;

    if (v_product ->> 'truffle')::boolean then
      insert into public.recipe_items (recipe_version_id, inventory_item_id, quantity)
      select v_rv_id, ii.id, 22 from public.inventory_items ii where ii.name = 'Trüflü Mayonez';
    end if;

    if (v_product ->> 'potato')::boolean then
      insert into public.recipe_items (recipe_version_id, inventory_item_id, quantity)
      select v_rv_id, ii.id, 1 from public.inventory_items ii where ii.name = 'Patates';
    end if;
  end loop;
end $$;

-- Yan ürünler: kesin reçeteleri henüz belli değil — boş bir versiyon 1 ile
-- seed edilir, satış girilebilir ama admin reçete tanımlayana kadar tüketim
-- hesaplanmaz.
insert into public.recipe_versions (menu_product_id, version_no)
select id, 1 from public.menu_products
where name in ('Peynir Çubukları', 'Soğan Halkası', 'Çıtır Tavuk');

-- İçecekler: satıldığında ilgili içecek stokundan 1 adet düşen 1 satırlık reçete.
with rv as (
  insert into public.recipe_versions (menu_product_id, version_no)
  select id, 1 from public.menu_products where category = 'drink'
  returning id, menu_product_id
)
insert into public.recipe_items (recipe_version_id, inventory_item_id, quantity)
select rv.id, ii.id, 1
from rv
join public.menu_products mp on mp.id = rv.menu_product_id
join public.inventory_items ii on lower(ii.name) = lower(mp.name);
