"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { success: true } | { success: false; error: string };

export async function addDepotStock(
  lines: { inventory_item_id: string; quantity_base: number }[],
  description: string | null,
): Promise<ActionResult> {
  await requireAdmin();

  if (lines.length === 0) {
    return { success: false, error: "En az bir kalem için miktar girin." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_depot_stock_entry", {
    p_lines: lines,
    p_description: description,
  });

  if (error) {
    return { success: false, error: "Stok eklenemedi: " + error.message };
  }

  revalidatePath("/warehouse");
  return { success: true };
}
