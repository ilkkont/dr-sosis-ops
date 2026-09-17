-- Gerekli PostgreSQL uzantıları
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "btree_gist"; -- etkinlik çakışma exclusion constraint'i için

-- ---------------------------------------------------------------------------
-- Yardımcı fonksiyonlar
-- ---------------------------------------------------------------------------
--
-- NOT: public.is_admin() bu dosyada DEĞİL, 20260826120100_profiles.sql
-- içinde (profiles tablosu oluşturulduktan hemen sonra) tanımlıdır.
-- `language sql` fonksiyonlar Postgres tarafından oluşturulduğu anda gövdesi
-- içindeki nesnelere karşı doğrulanır; profiles tablosu henüz yokken burada
-- tanımlanırsa `relation "public.profiles" does not exist` hatası alınır.

-- updated_at kolonunu otomatik güncelleyen tetikleyici fonksiyonu.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
