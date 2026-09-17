import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// Server Component / Server Action bağlamında kullanılan Supabase istemcisi.
// Oturum, kullanıcının kendi çerezleri üzerinden taşınır; bütün okuma/yazma
// işlemleri RLS'e tabidir (service_role burada asla kullanılmaz).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Bir Server Component render'ı içinden çağrıldığında çerez
            // set edilemez. proxy.ts oturumu her istekte zaten tazelediği
            // için burada güvenle yok sayılabilir.
          }
        },
      },
    },
  );
}
