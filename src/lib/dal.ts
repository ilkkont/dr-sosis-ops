import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// React cache(): aynı render geçişinde birden çok yerden çağrılsa bile
// yalnızca bir kez sorgu çalıştırır.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return profile;
});

/**
 * Her korumalı sayfanın ve her Server Action'ın en başında çağrılmalıdır.
 * Sayfa seviyesindeki bir kontrol Server Action'lara otomatik olarak
 * uzanmaz (Next.js Server Function'ları bağımsız giriş noktalarıdır) —
 * bu yüzden bu fonksiyon proxy.ts'e güvenmek yerine her yerde tekrar çağrılır.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin" || !profile.is_active) {
    redirect("/login");
  }
  return profile;
}
