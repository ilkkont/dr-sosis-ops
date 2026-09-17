import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

/**
 * Yönetim ekranlarındaki (karavan/stok kalemi/menü ürünü vb.) basit CRUD
 * işlemleri için ortak audit_logs kaydı. Kritik iş akışları (satış
 * kesinleştirme, sayım, transfer vb.) audit kaydını kendi Postgres RPC
 * fonksiyonları içinde, aynı transaction'da zaten yazıyor — bu yardımcı
 * yalnızca istemci tarafından doğrudan yapılan tablo yazımları içindir.
 */
export async function logAudit(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    oldValue?: Json | null;
    newValue?: Json | null;
  },
) {
  await supabase.from("audit_logs").insert({
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
  });
}
