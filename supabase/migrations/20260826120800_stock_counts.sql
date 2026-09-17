create type public.stock_count_status as enum ('draft', 'finalized');

create table public.stock_counts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events (id),
  caravan_id uuid not null references public.caravans (id),
  status public.stock_count_status not null default 'draft',
  counted_by uuid references public.profiles (id),
  counted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_stock_counts_updated_at
  before update on public.stock_counts
  for each row execute function public.set_updated_at();

alter table public.stock_counts enable row level security;

create policy stock_counts_select on public.stock_counts for select using (public.is_admin());
create policy stock_counts_insert on public.stock_counts for insert with check (public.is_admin());
create policy stock_counts_update on public.stock_counts for update using (public.is_admin()) with check (public.is_admin());

create table public.stock_count_lines (
  id uuid primary key default gen_random_uuid(),
  stock_count_id uuid not null references public.stock_counts (id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items (id),
  theoretical_qty numeric(14, 3) not null,
  physical_qty numeric(14, 3) not null,
  variance_qty numeric(14, 3) generated always as (physical_qty - theoretical_qty) stored,
  variance_pct numeric(8, 2) generated always as (
    case
      when theoretical_qty = 0 then null
      else round(((physical_qty - theoretical_qty) / theoretical_qty) * 100, 2)
    end
  ) stored,
  note text,
  unique (stock_count_id, inventory_item_id)
);

alter table public.stock_count_lines enable row level security;

create policy stock_count_lines_select on public.stock_count_lines
  for select using (public.is_admin());

-- Satırlar yalnızca sayım henüz 'draft' durumundayken eklenebilir/
-- değiştirilebilir/silinebilir; kesinleştirilmiş bir sayımın satırları
-- immutable kalır (yalnızca fn_finalize_stock_count tarafından yazılır).
create policy stock_count_lines_insert on public.stock_count_lines
  for insert with check (
    public.is_admin() and exists (
      select 1 from public.stock_counts sc
      where sc.id = stock_count_id and sc.status = 'draft'
    )
  );

create policy stock_count_lines_update on public.stock_count_lines
  for update using (
    public.is_admin() and exists (
      select 1 from public.stock_counts sc
      where sc.id = stock_count_id and sc.status = 'draft'
    )
  ) with check (
    public.is_admin() and exists (
      select 1 from public.stock_counts sc
      where sc.id = stock_count_id and sc.status = 'draft'
    )
  );

create policy stock_count_lines_delete on public.stock_count_lines
  for delete using (
    public.is_admin() and exists (
      select 1 from public.stock_counts sc
      where sc.id = stock_count_id and sc.status = 'draft'
    )
  );
