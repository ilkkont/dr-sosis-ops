# Supabase Kurulumu

## 1. Proje oluştur

1. [supabase.com](https://supabase.com) üzerinde yeni bir proje oluşturun (bölge olarak Avrupa'ya yakın bir bölge seçmeniz gecikmeyi azaltır).
2. Proje oluşturulduktan sonra **Project Settings → API** sayfasından şunları not alın:
   - `Project URL` → `.env.local` içinde `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `.env.local` içinde `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Migration'ları çalıştır

İki yöntemden birini kullanabilirsiniz.

### Yöntem A — Supabase CLI (önerilen)

```bash
npm install -g supabase
supabase login
cd dr-sosis-ops
supabase init          # supabase/ klasörü zaten var, yalnızca config.toml ekler
supabase link --project-ref <PROJECT_REF>
supabase db push        # supabase/migrations/*.sql dosyalarını sırayla uygular
```

Seed data'yı da yüklemek için:

```bash
supabase db push --include-seed
```

veya migration'lardan sonra tek seferlik:

```bash
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2)" -f supabase/seed.sql
```

### Yöntem B — Supabase Dashboard SQL Editor

1. **SQL Editor** sekmesini açın.
2. `supabase/migrations/` klasöründeki dosyaları **dosya adındaki sıraya göre** (tarih damgasıyla başlıyorlar) tek tek yapıştırıp çalıştırın.
3. Son olarak `supabase/seed.sql` içeriğini yapıştırıp çalıştırın.

> Migration'lar bu ortamda gerçek bir Postgres'e karşı çalıştırılıp
> doğrulanamadı (bu geliştirme ortamında yerel Postgres/Docker/Supabase CLI
> yoktu). SQL satır satır gözden geçirildi, ancak ilk çalıştırmada bir hata
> alırsanız hatayı olduğu gibi paylaşın — hızlıca düzeltilebilir.

## 3. Auth ayarları — herkese açık kaydı kapatın

**Authentication → Providers → Email** sayfasında:

- **Allow new users to sign up** seçeneğini **kapatın**. Uygulamada zaten
  herkese açık bir kayıt ekranı yok; bu ayar, Supabase Auth API'sinin
  doğrudan çağrılarak dışarıdan yeni kullanıcı oluşturulmasını da engeller.
- "Confirm email" ayarını kapatıp kapatmamak size kalmış; admin hesapları
  Dashboard'dan "Auto Confirm User" ile oluşturulacağından bu adım
  zorunlu değildir (bkz. [ADMIN_SETUP.md](ADMIN_SETUP.md)).

## 4. (Opsiyonel) Demo verisi

Uygulamayı boş değil, dolu bir örnekle görmek isterseniz `supabase/demo_data.sql`
dosyasını seed'den sonra bir kez çalıştırın. Kapanmış örnek bir etkinlik,
başlangıç stoku, kesinleşmiş bir satış, bir fire kaydı ve küçük bir sayım
farkı içeren kesinleşmiş bir gün sonu sayımı ekler. Production'da
çalıştırmanız önerilmez.

## 5. Doğrulama

SQL Editor'de aşağıdaki sorgu 15 tablo da RLS'in aktif olduğunu göstermeli:

```sql
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by relname;
```

`relrowsecurity` sütununun tamamı `t` (true) olmalı.

## 6. TypeScript tiplerini gerçek şemadan yeniden üret (opsiyonel ama önerilir)

`src/types/database.ts` elle yazılmıştır ve migration'larla senkron tutulmuştur.
Proje bağlandıktan sonra gerçek şemadan yeniden üretip diff'ini gözden
geçirmek, olası bir tutarsızlığı erken yakalamanızı sağlar:

```bash
npx supabase gen types typescript --project-id <PROJECT_REF> > src/types/database.ts
```
