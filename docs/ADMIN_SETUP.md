# Admin Hesabı Oluşturma

Uygulamada herkese açık bir kayıt ekranı yoktur. Yalnızca önceden
tanımlanmış hesaplar giriş yapabilir. Yeni bir admin eklemek tamamen
Supabase Dashboard üzerinden, kod veya script gerekmeden yapılır.

## Neden script gerekmiyor?

`supabase/migrations/20260826120100_profiles.sql` içindeki `handle_new_user()`
tetikleyicisi, `auth.users` tablosuna her yeni kullanıcı eklendiğinde
(Dashboard'dan, Admin API'den ya da başka bir yoldan — fark etmez) otomatik
olarak eşleşen bir `profiles` satırı açar; bu satır varsayılan olarak
`role = 'admin'` ve `is_active = true` ile oluşur. Yani Dashboard'dan bir
kullanıcı oluşturmak, o kullanıcıyı otomatik olarak panele erişim yetkisi
olan bir admin yapar.

## Adımlar

1. Supabase Dashboard'da projenize gidin.
2. **Authentication → Users → Add User** (veya "Invite user") seçeneğine tıklayın.
3. Admin kişinin e-posta adresini ve güçlü bir şifre girin.
4. **Auto Confirm User** seçeneğini işaretleyin (aksi halde kullanıcı e-posta
   onayı bekleyecektir — kayıt ekranı zaten kapalı olduğundan onay linkine
   tıklama akışı yoktur, bu yüzden bu seçenek işaretli olmalı).
5. Kaydedin. Bu işlemi ikinci admin için tekrarlayın.
6. `https://<uygulamanız>/login` adresinden bu e-posta/şifre ile giriş
   yapabilmelisiniz.

## Bir admini pasifleştirme

Bir admin hesabının erişimini geçici olarak kesmek isterseniz (hesabı
tamamen silmeden), panelin **Ayarlar** bölümünden ya da doğrudan SQL
Editor'den:

```sql
update public.profiles set is_active = false where id = '<user-id>';
```

`is_active = false` olan bir profil hem RLS tarafından hem de
`requireAdmin()` kontrolünden reddedilir — giriş yapamaz, mevcut oturumu
olsa bile bir sonraki sayfa isteğinde `/login`'e yönlendirilir.

## Şifreler nasıl saklanır?

Şifreler hiçbir zaman uygulama veritabanına (bu projenin `public` şeması)
yazılmaz. Supabase Auth, şifreleri kendi yönettiği `auth.users` şemasında
bcrypt ile hash'lenmiş olarak saklar; uygulama kodu bu değerlere hiç erişmez.
