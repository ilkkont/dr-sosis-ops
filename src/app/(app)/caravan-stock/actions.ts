"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { success: true; changed: number }
  | { success: false; error: string };

/**
 * Bir karavanın stoğunu verilen toplamlara eşitler. Delta hesabı veritabanında
 * (fn_set_caravan_stock) güncel bakiyeye göre yapılır; yalnızca değişen
 * kalemler gönderilir.
 */
export async function setCaravanStock(
  caravanId: string,
  lines: { inventory_item_id: string; new_total_base: number }[],
): Promise<ActionResult> {
  await requireAdmin();

  if (lines.length === 0) {
    return { success: true, changed: 0 };
  }
  if (lines.some((line) => !Number.isFinite(line.new_total_base) || line.new_total_base < 0)) {
    return { success: false, error: "Miktarlar 0 veya üzeri olmalı." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_set_caravan_stock", {
    p_caravan_id: caravanId,
    p_lines: lines,
    p_description: "Manuel karavan stok güncellemesi",
  });

  if (error) {
    return { success: false, error: "Karavan stoğu güncellenemedi: " + error.message };
  }

  revalidatePath("/caravan-stock");
  revalidatePath("/reports/stock-levels");
  return { success: true, changed: (data as { changed?: number } | null)?.changed ?? 0 };
}
