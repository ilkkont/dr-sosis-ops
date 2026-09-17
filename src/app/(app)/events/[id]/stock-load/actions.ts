"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { success: true } | { success: false; error: string };

export async function loadInitialStock(
  eventId: string,
  lines: { inventory_item_id: string; quantity_base: number; description?: string }[],
  copyFromStockCountId: string | null,
): Promise<ActionResult> {
  await requireAdmin();

  if (lines.length === 0 && !copyFromStockCountId) {
    return { success: false, error: "En az bir kalem için miktar girin." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_load_initial_stock", {
    p_event_id: eventId,
    p_lines: lines,
    p_copy_from_stock_count_id: copyFromStockCountId,
  });

  if (error) {
    return { success: false, error: "Stok yüklenemedi: " + error.message };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/stock-load`);
  return { success: true };
}
