create type public.event_status as enum ('preparation', 'open', 'closed', 'cancelled');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  name text not null,
  location text,
  caravan_id uuid not null references public.caravans (id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  expected_attendance integer,
  responsible_person text,
  note text,
  status public.event_status not null default 'preparation',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_chk check (end_time > start_time),
  -- Aynı karavan aynı zaman aralığında iki farklı (iptal edilmemiş)
  -- etkinliğe atanamaz. İptal edilen etkinlikler zamanı serbest bırakır.
  constraint events_no_overlap exclude using gist (
    caravan_id with =,
    tstzrange (start_time, end_time) with &&
  ) where (status <> 'cancelled')
);

create index events_caravan_date_idx on public.events (caravan_id, event_date);
create index events_status_idx on public.events (status);

create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

create policy events_select on public.events for select using (public.is_admin());
create policy events_insert on public.events for insert with check (public.is_admin());
create policy events_update on public.events for update using (public.is_admin()) with check (public.is_admin());
