create type public.movement_type as enum (
  'initial_load', 'additional_entry', 'return_to_depot',
  'transfer_out', 'transfer_in', 'recipe_consumption', 'waste',
  'complimentary', 'staff_meal', 'defective', 'count_adjustment',
  'sale_reversal_adjustment'
);
create type public.movement_source_type as enum (
  'sales_batch', 'stock_count', 'waste_record', 'stock_transfer', 'manual'
);

-- İki karavan arasındaki transferin iki bacağını (transfer_out/transfer_in)
-- eşleştiren küçük başlık tablosu.
create table public.stock_transfers (
  id uuid primary key default gen_random_uuid(),
  from_caravan_id uuid not null references public.caravans (id),
  to_caravan_id uuid not null references public.caravans (id),
  from_event_id uuid references public.events (id),
  to_event_id uuid references public.events (id),
  description text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint stock_transfers_diff_caravan_chk check (from_caravan_id <> to_caravan_id)
);

alter table public.stock_transfers enable row level security;

create policy stock_transfers_select on public.stock_transfers for select using (public.is_admin());
create policy stock_transfers_insert on public.stock_transfers for insert with check (public.is_admin());

-- Immutable stok hareket defteri. Stok bakiyesi asla doğrudan güncellenmez;
-- her zaman bu tablonun SUM(quantity_base) toplamından hesaplanır
-- (bkz. fn_theoretical_balance / v_stock_balances).
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  caravan_id uuid not null references public.caravans (id),
  event_id uuid not null references public.events (id),
  inventory_item_id uuid not null references public.inventory_items (id),
  movement_type public.movement_type not null,
  -- İşaretli miktar (ana birimde): pozitif = giriş, negatif = çıkış.
  quantity_base numeric(14, 3) not null check (quantity_base <> 0),
  source_type public.movement_source_type,
  source_id uuid,
  description text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index stock_movements_balance_idx
  on public.stock_movements (event_id, caravan_id, inventory_item_id);
create index stock_movements_source_idx on public.stock_movements (source_type, source_id);
create index stock_movements_caravan_created_idx on public.stock_movements (caravan_id, created_at);

alter table public.stock_movements enable row level security;

create policy stock_movements_select on public.stock_movements for select using (public.is_admin());
create policy stock_movements_insert on public.stock_movements for insert with check (public.is_admin());
-- update/delete policy'si kasıtlı olarak yok: hareket defteri immutable'dır,
-- yalnızca yeni ters kayıtlarla (örn. sale_reversal_adjustment) düzeltilir.
