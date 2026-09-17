# Dr.Sosis Operasyon Paneli

Dr.Sosis'in 5 satış karavanı için stok, satış ve etkinlik operasyon uygulaması.
Her karavana etkinlik başına özel stok yüklenir; gün sonunda satış adetleri
girilir, reçetelere göre teorik malzeme tüketimi hesaplanır, fiziksel sayım
ile karşılaştırılır ve fark raporlanır.

## Teknoloji Yığını

- Next.js 16 (App Router, Turbopack) + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui (Base UI)
- Supabase (PostgreSQL, Auth, Row Level Security)
- Vercel (deploy)
- Vitest (birim testleri)
- PWA (yüklenebilir uygulama, manifest + service worker)

## Hızlı Başlangıç

```bash
npm install
cp .env.example .env.local   # Supabase proje bilgilerinizi girin
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde açılır (bu
depoda geliştirme sırasında `-p 3600` ile farklı bir port kullanılmıştır,
bkz. `.claude/launch.json` — kendi ortamınızda gerekmez).

Supabase projesi olmadan uygulama açılır ancak giriş/veri işlemleri
çalışmaz. Gerçek bir proje kurmak için [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)
rehberini izleyin.

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Prodüksiyon derlemesi |
| `npm run start` | Derlenmiş uygulamayı çalıştırır |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript tip kontrolü |
| `npm test` | Vitest birim testleri |
| `npm run format` | Prettier ile biçimlendirme |

## Kurulum Rehberleri

1. **[Supabase kurulumu](docs/SUPABASE_SETUP.md)** — proje oluşturma, migration'ları çalıştırma, seed data, Auth ayarları
2. **[Admin hesabı oluşturma](docs/ADMIN_SETUP.md)** — 2 admin hesabının nasıl açılacağı
3. **[Vercel'e yayınlama](docs/VERCEL_DEPLOY.md)** — prodüksiyon deploy adımları

## Proje Yapısı

```
src/
  app/
    (auth)/login/          Giriş ekranı
    (app)/                 Korumalı panel (sol menü / mobil drawer kabuğu)
      dashboard/           Özet gösterge paneli
      caravans/            Karavan yönetimi
      inventory/           Stok kalemi yönetimi
      menu-products/       Menü ürünleri + reçete editörü
      events/[id]/         Etkinlik detayı, başlangıç stoku, satış,
                            stok hareketleri, sayım, kapatma
      reports/             Raporlar + Excel/CSV dışa aktarma
  lib/
    supabase/               Server/browser Supabase istemcileri + proxy
    validations/            Zod şemaları
    dal.ts                  Data Access Layer (requireAdmin)
    reports.ts, units.ts, datetime.ts, csv.ts   Saf yardımcı fonksiyonlar
  proxy.ts                  Next.js 16 proxy (middleware) — oturum kontrolü
supabase/
  migrations/               SQL migration dosyaları (şema, RLS, RPC'ler)
  seed.sql                  Zorunlu başlangıç verisi (karavanlar, stok, reçeteler)
  demo_data.sql             Opsiyonel örnek etkinlik/satış verisi
tests/                      Vitest birim testleri
```

## Güvenlik Mimarisi (özet)

- Herkese açık kayıt ekranı yok; yalnızca Supabase Auth üzerinden e-posta/şifre girişi.
- Row Level Security tüm tablolarda aktif; yalnızca aktif admin profilleri okuma/yazma yapabilir, anonim erişim tamamen kapalı.
- Kritik iş mantığı (satış kesinleştirme, sayım, transfer, reçete versiyonlama) istemci tarafında değil, Postgres fonksiyonlarında (`supabase/migrations/*_rpc_*.sql`) çalışır.
- Stok bakiyesi hiçbir yerde doğrudan güncellenmez; her zaman immutable `stock_movements` defterinin toplamından hesaplanır.
- `service_role` anahtarı uygulama çalışırken hiç kullanılmaz; yalnızca proje sahibinin Supabase Dashboard'ı üzerinden yönetilir.
- Her Server Action ve her korumalı sayfa, proxy'den bağımsız olarak kendi içinde yetki kontrolü yapar (`requireAdmin()`).

Detaylı mimari kararlar ve varsayımlar için bkz. [CLAUDE.md](CLAUDE.md).
