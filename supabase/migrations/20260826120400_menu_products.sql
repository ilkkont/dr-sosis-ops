create type public.menu_category as enum ('hotdog', 'hotdog_potato', 'side', 'drink');

create table public.menu_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category public.menu_category not null,
  -- İçecek ürünleri için bilgilendirme amaçlı bağlantı: hangi stok kalemi
  -- eşleşiyor. Gerçek stok düşümü her zaman recipe_items üzerinden yapılır
  -- (içecekler de 1 satırlık bir reçete olarak modellenir), bu kolon yalnızca
  -- reçete editöründe otomatik öneri/okunabilirlik içindir.
  linked_drink_item_id uuid references public.inventory_items (id),
  -- Şu an kullanılmıyor: şartnamede fiyatlandırma/ciro modülü tanımlı değil.
  -- İleride eklenebilecek bir fiyatlandırma fazı için ayrılmıştır.
  unit_price numeric(10, 2),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index menu_products_name_key on public.menu_products (lower(name));

create trigger trg_menu_products_updated_at
  before update on public.menu_products
  for each row execute function public.set_updated_at();

alter table public.menu_products enable row level security;

create policy menu_products_select on public.menu_products for select using (public.is_admin());
create policy menu_products_insert on public.menu_products for insert with check (public.is_admin());
create policy menu_products_update on public.menu_products for update using (public.is_admin()) with check (public.is_admin());
