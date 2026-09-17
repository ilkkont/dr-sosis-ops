# Vercel'e Yayınlama

## Ön koşul

[Supabase kurulumu](SUPABASE_SETUP.md) tamamlanmış, migration'lar ve seed
data gerçek projenize uygulanmış olmalı.

## Adımlar

1. Bu depoyu bir GitHub/GitLab/Bitbucket reposuna gönderin (repo kökü
   `dr-sosis-ops/` klasörü olmalı, ya da Vercel'de "Root Directory" ayarını
   `dr-sosis-ops` olarak belirtin).
2. [vercel.com/new](https://vercel.com/new) üzerinden repoyu import edin.
   Framework olarak Next.js otomatik algılanır.
3. **Environment Variables** bölümüne şunları ekleyin (Production, Preview
   ve Development ortamlarının hepsi için):

   | Değişken | Değer |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL'iniz |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase `anon public` anahtarınız |
   | `NEXT_PUBLIC_APP_URL` | Vercel'in size vereceği prodüksiyon URL'i (deploy sonrası güncelleyebilirsiniz) |

   `SUPABASE_SERVICE_ROLE_KEY` **buraya asla eklenmemelidir** — uygulama
   çalışırken bu anahtara hiç ihtiyaç duymaz (bkz. [ADMIN_SETUP.md](ADMIN_SETUP.md)'de
   açıklanan admin oluşturma akışı, bu anahtarı gerektirmez).

4. **Deploy** butonuna basın.
5. Deploy tamamlandıktan sonra Supabase Dashboard'da
   **Authentication → URL Configuration** kısmına Vercel'in verdiği
   prodüksiyon URL'ini **Site URL** ve **Redirect URLs** olarak ekleyin.

## Deploy sonrası kontrol listesi

- [ ] `/login` sayfası açılıyor ve marka kimliği (logo, renkler) doğru görünüyor
- [ ] Gerçek bir admin hesabıyla giriş yapılabiliyor (bkz. ADMIN_SETUP.md)
- [ ] Karavanlar/Stok Kalemleri sayfalarında seed data görünüyor
- [ ] Bir test etkinliği oluşturup başlangıç stoku yüklenebiliyor
- [ ] PWA: mobil tarayıcıda "Ana Ekrana Ekle" seçeneği çıkıyor

## Güvenlik başlıkları

`next.config.ts` içinde tanımlı CSP, `NEXT_PUBLIC_SUPABASE_URL`'inizin
`*.supabase.co` alan adında olduğunu varsayar (standart Supabase projeleri
için geçerlidir). Özel bir alan adı (custom domain) kullanıyorsanız
`connect-src` yönergesini buna göre güncelleyin.
