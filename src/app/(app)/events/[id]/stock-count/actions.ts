"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { StockCountInput } from "@/lib/validations/stock-count";

export type ActionResult = { success: true } | { success: false; error: string };

export async function finalizeStockCount(
  eventId: string,
  input: StockCountInput,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("caravan_id")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) {
    return { success: false, error: "Etkinlik bulunamadı." };
  }

  let { data: count } = await supabase
    .from("stock_counts")
    .select("id, status")
    .eq("event_id", eventId)
    .maybeSingle();

  if (count && count.status === "finalized") {
    return { success: false, error: "Bu etkinliğin sayımı zaten kesinleşmiş." };
  }

  if (!count) {
    const { data: created, error } = await supabase
      .from("stock_counts")
      .insert({ event_id: eventId, caravan_id: event.caravan_id })
      .select("id, status")
      .single();
    if (error || !created) {
      return { success: false, error: "Sayım oluşturulamadı." };
    }
    count = created;
  }

  const lines = input.lines
    .filter((line) => typeof line.physical_qty === "number")
    .map((line) => ({
      inventory_item_id: line.inventory_item_id,
      physical_qty: line.physical_qty,
      note: line.note || null,
    }));

  const { error } = await supabase.rpc("fn_finalize_stock_count", {
    p_stock_count_id: count.id,
    p_lines: lines,
  });

  if (error) {
    return { success: false, error: "Sayım kesinleştirilemedi: " + error.message };
  }

  revalidatePath(`/events/${eventId}/stock-count`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/close`);
  return { success: true };
}
