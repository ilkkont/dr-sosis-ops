@AGENTS.md

# Dr.Sosis Operasyon Paneli — proje notları

Stok/satış/karavan operasyon uygulaması. Tam mimari plan ve varsayımlar
için `.claude/plans/lovely-munching-wombat.md` dosyasına bakılabilir
(orijinal onaylanmış plan).

## Mimari ilkeler (sapılmaması gereken kararlar)

- **Stok bakiyesi hiçbir yerde bir kolonda tutulmaz.** Her zaman
  `stock_movements` immutable defterinin `SUM(quantity_base)` toplamından
  hesaplanır (`fn_theoretical_balance`, `v_stock_balances`). Yeni bir "stok
  düzeltme" ihtiyacı çıkarsa, mevcut bir satırı UPDATE etmek yerine yeni bir
  ters kayıt eklenir.
- **Kritik iş mantığı yalnızca Postgres RPC fonksiyonlarında** (`supabase/migrations/*_rpc_*.sql`).
  İstemci veya Server Action asla reçete tüketimini, negatif stok kontrolünü
  veya sayım/transfer hesaplarını kendi başına yapmaz — her zaman ilgili
  `fn_*` fonksiyonunu çağırır.
- **RLS her tabloda aktif**, tek policy deseni: `public.is_admin()`. Hiçbir
  tabloda DELETE policy'si yoktur (kritik kayıtlar silinmez, yalnızca
  pasifleştirilir veya yeni versiyon/ters kayıtla düzeltilir).
- **Her Server Action ve her korumalı sayfa `requireAdmin()` ile başlar**
  (`src/lib/dal.ts`) — `src/proxy.ts` yalnızca "optimistic" bir ön kontroldür,
  tek başına yeterli güvenlik katmanı değildir (Next.js'in kendi güvenlik
  rehberi bunu açıkça belirtir: Server Function'lar proxy zincirinden
  bağımsız çağrılabilir).
- **react-hook-form + zod ile `z.coerce.number()` kullanılan her formda**
  `useForm<FormInput, unknown, Output>()` şeklinde üç generic parametre
  kullanılmalı (`z.input`/`z.output` ayrımı) — aksi halde zodResolver tip
  hatası verir. Örnek: `src/app/(app)/inventory/inventory-form-dialog.tsx`.
- **Select/Dialog/Sheet gibi bileşimlenebilir shadcn bileşenleri Base UI
  tabanlıdır (Radix değil)** — `asChild` yoktur, bunun yerine `render={<Element />}`
  prop'u kullanılır. Örnek: `<Button render={<Link href="/x" />}>Metin</Button>`.
- **`src/types/database.ts` elle yazılmıştır.** Her tabloya `Relationships`
  alanı eklenmeden embedded (nested) Supabase sorguları `never` tipine
  düşer — bu proje bunu bir kez zor yoldan öğrendi, yeni tablo eklerken
  aynı hataya düşmeyin.
- **Türkiye saat dilimi**: Europe/Istanbul 2016'dan beri kalıcı UTC+03:00
  (DST yok), bu yüzden `src/lib/datetime.ts` sabit ofset kullanır, ayrı bir
  tz kütüphanesi gerekmez.

## Geliştirme döngüsü

Her değişiklikten sonra: `npm run lint && npm run typecheck && npm test && npm run build`.

`npm run typecheck`'i (`tsc --noEmit`) `npm run dev` **çalışırken aynı anda**
çalıştırmayın — ikisi de `.next/types/*.d.ts` dosyalarını eşzamanlı
yazdığında " 2.ts" gibi çakışan kopya dosyalar oluşur ve sahte
`LayoutProps`/cache tip hataları görürsünüz. Önce dev sunucusunu durdurun
(veya yalnızca `npm run build` çalıştırın, o zaten kendi TypeScript
kontrolünü doğru sırayla yapar).
Bu depoda Docker/yerel Postgres/Supabase CLI yoktur — SQL migration'lar
gerçek bir Postgres'e karşı test edilememiştir; yalnızca dikkatli statik
inceleme ile doğrulanmıştır. Gerçek bir Supabase projesine ilk uygulamada
hata alınırsa hemen düzeltilebilir, bkz. `docs/SUPABASE_SETUP.md`.

## Kapsam dışı bırakılan / bilinçli olarak basitleştirilen noktalar

- Fiyatlandırma/ciro modülü yok (şartnamede tanımlı değildi; `menu_products.unit_price` ileride kullanılmak üzere ayrıldı, şu an okunmuyor).
- PWA tam offline-yazma desteklemiyor; yalnızca app-shell/statik varlıklar önbelleğe alınır (bkz. `public/sw.js`).
- Etkinlikler gece yarısını geçen (overnight) saat aralıklarını desteklemiyor — `end_time > start_time` aynı gün varsayımıyla doğrulanır.
