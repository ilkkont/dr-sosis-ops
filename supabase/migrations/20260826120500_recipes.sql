create table public.recipe_versions (
  id uuid primary key default gen_random_uuid(),
  menu_product_id uuid not null references public.menu_products (id),
  version_no integer not null,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  is_active boolean not null default true,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (menu_product_id, version_no)
);

-- Bir üründe aynı anda yalnızca bir aktif reçete versiyonu olabilir.
create unique index recipe_versions_one_active_per_product
  on public.recipe_versions (menu_product_id)
  where (is_active);

alter table public.recipe_versions enable row level security;

create policy recipe_versions_select on public.recipe_versions for select using (public.is_admin());
create policy recipe_versions_insert on public.recipe_versions for insert with check (public.is_admin());
create policy recipe_versions_update on public.recipe_versions for update using (public.is_admin()) with check (public.is_admin());

create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_version_id uuid not null references public.recipe_versions (id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items (id),
  quantity numeric(14, 3) not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (recipe_version_id, inventory_item_id)
);

alter table public.recipe_items enable row level security;

create policy recipe_items_select on public.recipe_items for select using (public.is_admin());
create policy recipe_items_insert on public.recipe_items for insert with check (public.is_admin());
-- recipe_items kasıtlı olarak update/delete policy'sine sahip değil: bir
-- reçete değiştirilmek istendiğinde fn_create_recipe_version() yeni bir
-- versiyon açar, eskisi tarihe karışır — geçmiş satışlar ve raporlar bozulmaz.
