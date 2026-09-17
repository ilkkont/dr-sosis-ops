create type public.sales_batch_status as enum ('draft', 'finalized', 'corrected');

create table public.sales_batches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id),
  caravan_id uuid not null references public.caravans (id),
  status public.sales_batch_status not null default 'draft',
  -- İstemci tarafında üretilen ve tekrar gönderimlerde aynı kalan anahtar;
  -- aynı formun iki kez kesinleştirilmesini engeller (idempotency).
  idempotency_key uuid not null unique,
  -- Bir düzeltme akışında eski (kesinleşmiş) batch'i işaret eder; eski batch
  -- asla silinmez, yalnızca status='corrected' olarak işaretlenir.
  supersedes_batch_id uuid references public.sales_batches (id),
  finalized_by uuid references public.profiles (id),
  finalized_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sales_batches_event_idx on public.sales_batches (event_id);

create trigger trg_sales_batches_updated_at
  before update on public.sales_batches
  for each row execute function public.set_updated_at();

alter table public.sales_batches enable row level security;

create policy sales_batches_select on public.sales_batches for select using (public.is_admin());
create policy sales_batches_insert on public.sales_batches for insert with check (public.is_admin());
create policy sales_batches_update on public.sales_batches for update using (public.is_admin()) with check (public.is_admin());

create table public.sales_lines (
  id uuid primary key default gen_random_uuid(),
  sales_batch_id uuid not null references public.sales_batches (id) on delete cascade,
  menu_product_id uuid not null references public.menu_products (id),
  -- Kesinleştirme anında çözümlenen reçete versiyonu (snapshot): reçete daha
  -- sonra değişse bile bu satışın tükettiği malzemeler sabit kalır.
  recipe_version_id uuid references public.recipe_versions (id),
  quantity integer not null check (quantity >= 0),
  created_at timestamptz not null default now(),
  unique (sales_batch_id, menu_product_id)
);

alter table public.sales_lines enable row level security;

create policy sales_lines_select on public.sales_lines for select using (public.is_admin());

-- Satırlar yalnızca ait olduğu batch 'draft' durumundayken yazılabilir;
-- kesinleşmiş bir satışın satırları immutable kalır.
create policy sales_lines_insert on public.sales_lines
  for insert with check (
    public.is_admin() and exists (
      select 1 from public.sales_batches sb
      where sb.id = sales_batch_id and sb.status = 'draft'
    )
  );

create policy sales_lines_update on public.sales_lines
  for update using (
    public.is_admin() and exists (
      select 1 from public.sales_batches sb
      where sb.id = sales_batch_id and sb.status = 'draft'
    )
  ) with check (
    public.is_admin() and exists (
      select 1 from public.sales_batches sb
      where sb.id = sales_batch_id and sb.status = 'draft'
    )
  );

create policy sales_lines_delete on public.sales_lines
  for delete using (
    public.is_admin() and exists (
      select 1 from public.sales_batches sb
      where sb.id = sales_batch_id and sb.status = 'draft'
    )
  );
