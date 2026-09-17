"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { movementFormSchema, type MovementInput } from "@/lib/validations/movement";
import { toBaseUnit } from "@/lib/units";

export type ActionResult = { success: true } | { success: false; error: string };

type ItemMeta = {
  unit_type: "count" | "weight" | "portion";
  portion_kg_factor: number | null;
};

export async function recordMovement(
  eventId: string,
  input: MovementInput,
  item: ItemMeta,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = movementFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Geçersiz form verisi." };
  }

  const quantityBase = toBaseUnit(
    parsed.data.quantity,
    item.unit_type,
    parsed.data.unit_choice,
    item.portion_kg_factor,
  );

  const supabase = await createClient();
  const line = { inventory_item_id: parsed.data.inventory_item_id, quantity_base: quantityBase };

  if (parsed.data.kind === "additional_entry") {
    const { error } = await supabase.rpc("fn_add_stock_entry", {
      p_event_id: eventId,
      p_lines: [line],
      p_description: parsed.data.reason || null,
    });
    if (error) return { success: false, error: error.message };
  } else if (parsed.data.kind === "return_to_depot") {
    const { error } = await supabase.rpc("fn_return_to_depot", {
      p_event_id: eventId,
      p_lines: [line],
      p_description: parsed.data.reason || null,
    });
    if (error) return { success: false, error: error.message };
  } else if (parsed.data.kind === "transfer") {
    const { data: fromEvent } = await supabase
      .from("events")
      .select("caravan_id")
      .eq("id", eventId)
      .maybeSingle();
    const { data: toEvent } = await supabase
      .from("events")
      .select("caravan_id")
      .eq("id", parsed.data.target_event_id!)
      .maybeSingle();
    if (!fromEvent || !toEvent) {
      return { success: false, error: "Etkinlik bulunamadı." };
    }
    const { error } = await supabase.rpc("fn_transfer_stock", {
      p_from_caravan_id: fromEvent.caravan_id,
      p_to_caravan_id: toEvent.caravan_id,
      p_from_event_id: eventId,
      p_to_event_id: parsed.data.target_event_id!,
      p_lines: [line],
      p_description: parsed.data.reason || null,
    });
    if (error) return { success: false, error: error.message };
  } else {
    // fire | complimentary | staff_meal | defective
    const { error } = await supabase.rpc("fn_record_waste", {
      p_event_id: eventId,
      p_inventory_item_id: parsed.data.inventory_item_id,
      p_waste_type: parsed.data.kind,
      p_quantity_base: quantityBase,
      p_reason: parsed.data.reason || null,
    });
    if (error) return { success: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}/movements`);
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
