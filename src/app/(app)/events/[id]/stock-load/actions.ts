"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { success: true }
  | { success: false; error: string }
  | { success: false; error: string; insufficientItems: { inventory_item_id: string; requested: number; depot_balance: number }[] };

/**
 * Etkinliğe gönderilen stok kalemlerini günceller. Her kalem için istenen
 * yeni toplam ile o ana kadar depodan gönderilmiş toplam arasındaki fark
 * (delta) hesaplanır: pozitifse depodan gönderim, negatifse depoya iade
 * olarak işlenir. stock_movements immutable olduğundan hiçbir satır
 * güncellenmez — yalnızca yeni bir hareket eklenir.
 */
export async function updateEventStockFromDepot(
  eventId: string,
  lines: { inventory_item_id: string; new_total_base: number; current_total_base: number }[],
): Promise<ActionResult> {
  await requireAdmin();

  const changed = lines.filter((line) => line.new_total_base !== line.current_total_base);
  if (changed.length === 0) {
    return { success: true };
  }

  const supabase = await createClient();

  const toSend = changed
    .filter((line) => line.new_total_base > line.current_total_base)
    .map((line) => ({
      inventory_item_id: line.inventory_item_id,
      quantity_base: line.new_total_base - line.current_total_base,
    }));

  const toReturn = changed
    .filter((line) => line.new_total_base < line.current_total_base)
    .map((line) => ({
      inventory_item_id: line.inventory_item_id,
      quantity_base: line.current_total_base - line.new_total_base,
    }));

  if (toSend.length > 0) {
    const { data, error } = await supabase.rpc("fn_send_depot_to_event", {
      p_event_id: eventId,
      p_lines: toSend,
    });
    if (error) {
      return { success: false, error: "Depodan gönderilemedi: " + error.message };
    }
    const result = data as { status: string; items?: { inventory_item_id: string; requested: number; depot_balance: number }[] };
    if (result?.status === "insufficient_depot_stock") {
      return {
        success: false,
        error: "Depoda yeterli stok yok.",
        insufficientItems: result.items ?? [],
      };
    }
  }

  if (toReturn.length > 0) {
    const { error } = await supabase.rpc("fn_return_to_depot", {
      p_event_id: eventId,
      p_lines: toReturn,
      p_description: "Stok girişi düzenlemesi",
    });
    if (error) {
      return { success: false, error: "Depoya iade edilemedi: " + error.message };
    }
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/stock-load`);
  revalidatePath("/warehouse");
  return { success: true };
}
