-- ---------------------------------------------------------------------------
-- Yönetilebilir stok kategorileri + kalem başına birim etiketi/paket boyutu.
-- Bu dosya güvenle tekrar çalıştırılabilir (idempotent).
--
-- Eski `inventory_items.category` enum kolonu bu migration'da SİLİNMEZ
-- (yalnızca nullable yapılır): migration ile yeni kodun deploy'u arasındaki
-- kısa sürede eski ekranlar kırılmasın diye. Sonraki bir temizlik turunda
-- düşürülebilir.
-- ---------------------------------------------------------------------------

create table if not exists public.inventory_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists inventory_categories_name_key
  on public.inventory_categories (lower(name));

alter table public.inventory_categories enable row level security;

drop policy if exists inventory_categories_select on public.inventory_categories;
create policy inventory_categories_select on public.inventory_categories
  for select using (public.is_admin());
drop policy if exists inventory_categories_insert on public.inventory_categories;
create policy inventory_categories_insert on public.inventory_categories
  for insert with check (public.is_admin());
drop policy if exists inventory_categories_update on public.inventory_categories;
create policy inventory_categories_update on public.inventory_categories
  for update using (public.is_admin()) with check (public.is_admin());
-- delete policy'si kasıtlı olarak yok: kategoriler pasifleştirilir.

insert into public.inventory_categories (name, sort_order)
select v.name, v.sort_order
from (values
  ('Ekipman', 10),
  ('Sosis - Sarf', 20),
  ('90gr Sosis', 30),
  ('75gr Sosis', 40),
  ('Patates', 50),
  ('Soslar', 60),
  ('Paketleme', 70),
  ('İçecekler', 80),
  ('Mısır', 90),
  ('Ekstralar', 100)
) as v(name, sort_order)
where not exists (
  select 1 from public.inventory_categories c where lower(c.name) = lower(v.name)
);

alter table public.inventory_items
  add column if not exists category_id uuid references public.inventory_categories (id),
  add column if not exists unit_label text,
  add column if not exists pack_size numeric(14, 3);

alter table public.inventory_items drop constraint if exists inventory_items_pack_size_chk;
alter table public.inventory_items
  add constraint inventory_items_pack_size_chk check (pack_size is null or pack_size > 0);

alter table public.inventory_items alter column category drop not null;

-- Eski enum değerlerini yeni kategorilere taşı (yalnızca henüz atanmamış
-- kalemler). Türkçe harfli isimlerde lower() locale'e bağlı davranabildiğinden
-- eşleştirme isimle değil sort_order ile yapılır.
update public.inventory_items ii
set category_id = c.id
from public.inventory_categories c
where ii.category_id is null
  and c.sort_order = case ii.category::text
    when 'bread' then 20
    when 'sausage' then 20
    when 'cheese' then 20
    when 'topping' then 20
    when 'sauce' then 60
    when 'drink' then 80
    when 'packaging' then 70
    when 'produce' then 50
    else 100
  end;
