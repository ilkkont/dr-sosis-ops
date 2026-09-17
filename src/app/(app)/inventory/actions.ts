"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import {
  inventoryItemSchema,
  defaultDisplayUnit,
  type InventoryItemInput,
} from "@/lib/validations/inventory";

export type ActionResult = { success: true } | { success: false; error: string };

function toRow(input: InventoryItemInput) {
  return {
    name: input.name,
    category: input.category,
    unit_type: input.unit_type,
    display_input_unit: defaultDisplayUnit(input.unit_type),
    portion_kg_factor: input.unit_type === "portion" ? input.portion_kg_factor : null,
    critical_level: input.critical_level,
    is_active: input.is_active,
  };
}

export async function createInventoryItem(input: InventoryItemInput): Promise<ActionResult> {
  const profile = await requireAdmin();

  const parsed = inventoryItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Geçersiz form verisi." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .insert(toRow(parsed.data))
    .select("id")
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.code === "23505" ? "Bu isimde bir stok kalemi zaten var." : "Stok kalemi oluşturulamadı.",
    };
  }

  await logAudit(supabase, {
    userId: profile.id,
    action: "inventory_item.create",
    entityType: "inventory_items",
    entityId: data.id,
    newValue: parsed.data,
  });

  revalidatePath("/inventory");
  return { success: true };
}

export async function updateInventoryItem(
  id: string,
  input: InventoryItemInput,
): Promise<ActionResult> {
  const profile = await requireAdmin();

  const parsed = inventoryItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Geçersiz form verisi." };
  }

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("inventory_items")
    .update(toRow(parsed.data))
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: error.code === "23505" ? "Bu isimde bir stok kalemi zaten var." : "Stok kalemi güncellenemedi.",
    };
  }

  await logAudit(supabase, {
    userId: profile.id,
    action: "inventory_item.update",
    entityType: "inventory_items",
    entityId: id,
    oldValue: before,
    newValue: parsed.data,
  });

  revalidatePath("/inventory");
  return { success: true };
}
