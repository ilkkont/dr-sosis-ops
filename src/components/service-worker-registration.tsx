"use client";

import { useEffect } from "react";

// Service worker yalnızca production'da kaydedilir: geliştirme sırasında
// Turbopack HMR ile çakışıp kafa karıştırıcı önbellekleme davranışına yol
// açabilir.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Kayıt başarısız olsa bile uygulama normal şekilde çalışmaya devam eder.
      });
    }
  }, []);

  return null;
}
