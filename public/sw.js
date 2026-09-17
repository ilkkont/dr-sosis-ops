// Dr.Sosis Operasyon Paneli — minimal PWA service worker.
//
// Kasıtlı olarak dar kapsamlı: yalnızca statik marka varlıklarını
// (ikon/manifest) cache-first sunar ki uygulama ana ekrana kurulabilsin.
// Uygulama sayfaları, API/RPC çağrıları ve tüm veri asla önbellekten
// sunulmaz — stok/satış gibi kritik veriler için "bayat" bir yanıt görmek
// yanlış karar almaya yol açabilir, bu yüzden network-first/passthrough
// tercih edildi (bkz. proje planı: tam offline-yazma desteklenmiyor).
const CACHE_NAME = "dr-sosis-shell-v1";
const SHELL_ASSETS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request)),
    );
  }
  // Diğer her şey (sayfalar, RPC/API çağrıları) her zaman ağdan gelir.
});
