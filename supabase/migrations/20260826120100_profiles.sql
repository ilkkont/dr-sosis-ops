create type public.app_role as enum ('admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.app_role not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Çağıran kullanıcının aktif bir admin profili olup olmadığını kontrol eder.
-- Bütün RLS policy'leri bu fonksiyona dayanır. `security invoker` ile normal
-- RLS kısıtlarına tabi çalışır; aşağıdaki "kendi satırını her zaman
-- okuyabilme" policy'si sayesinde sonsuz özyinelemeye girmez. profiles
-- tablosundan HEMEN SONRA tanımlanır (bkz. 20260826120000 dosyasındaki not).
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active
  );
$$;

-- Yeni bir auth.users kaydı oluştuğunda otomatik profil satırı açar.
-- security definer: bu trigger fonksiyonu, profiles tablosuna RLS'i bypass
-- ederek (fonksiyon sahibi rolüyle) yazabilmelidir; aksi halde ilk admin
-- girişinde kendi profilini oluşturamaz (henüz hiçbir admin profili yokken
-- is_admin() daima false döner).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

-- Herkes kendi profilini okuyabilir; adminler herkesi okuyabilir. Bu policy,
-- is_admin() içindeki alt sorgunun sonsuz özyinelemeye girmesini engeller.
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy profiles_update on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- Kasıtlı olarak insert policy yok: profil satırları yalnızca yukarıdaki
-- security definer trigger ile oluşturulur.
