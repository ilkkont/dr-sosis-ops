"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { inventoryCategorySchema, type InventoryCategoryInput } from "@/lib/validations/inventory";

export type ActionResult = { success: true } | { success: false; error: string };

function revalidateCategoryPages() {
  revalidatePath("/inventory");
  revalidatePath("/warehouse");
  revalidatePath("/caravan-stock");
  revalidatePath("/reports/stock-levels");
}

export async function createInventoryCategory(
  input: InventoryCategoryInput,
): Promise<ActionResult> {
  const profile = await requireAdmin();

  const parsed = inventoryCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Geçersiz form verisi." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_categories")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) {
    return {
      success: false,
      error:
        error?.code === "23505" ? "Bu isimde bir kategori zaten var." : "Kategori oluşturulamadı.",
    };
  }

  await logAudit(supabase, {
    userId: profile.id,
    action: "inventory_category.create",
    entityType: "inventory_categories",
    entityId: data.id,
    newValue: parsed.data,
  });

  revalidateCategoryPages();
  return { success: true };
}

export async function updateInventoryCategory(
  id: string,
  input: InventoryCategoryInput,
): Promise<ActionResult> {
  const profile = await requireAdmin();

  const parsed = inventoryCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Geçersiz form verisi." };
  }

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("inventory_categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("inventory_categories").update(parsed.data).eq("id", id);

  if (error) {
    return {
      success: false,
      error:
        error.code === "23505" ? "Bu isimde bir kategori zaten var." : "Kategori güncellenemedi.",
    };
  }

  await logAudit(supabase, {
    userId: profile.id,
    action: "inventory_category.update",
    entityType: "inventory_categories",
    entityId: id,
    oldValue: before,
    newValue: parsed.data,
  });

  revalidateCategoryPages();
  return { success: true };
}
