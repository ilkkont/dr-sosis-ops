"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { menuProductSchema, type MenuProductInput } from "@/lib/validations/menu-product";
import { recipeFormSchema, type RecipeInput } from "@/lib/validations/menu-product";

export type ActionResult = { success: true } | { success: false; error: string };

export async function createMenuProduct(input: MenuProductInput): Promise<ActionResult> {
  const profile = await requireAdmin();

  const parsed = menuProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Geçersiz form verisi." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_products")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.code === "23505" ? "Bu isimde bir ürün zaten var." : "Ürün oluşturulamadı.",
    };
  }

  await logAudit(supabase, {
    userId: profile.id,
    action: "menu_product.create",
    entityType: "menu_products",
    entityId: data.id,
    newValue: parsed.data,
  });

  revalidatePath("/menu-products");
  return { success: true };
}

export async function updateMenuProduct(
  id: string,
  input: MenuProductInput,
): Promise<ActionResult> {
  const profile = await requireAdmin();

  const parsed = menuProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Geçersiz form verisi." };
  }

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("menu_products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("menu_products").update(parsed.data).eq("id", id);

  if (error) {
    return {
      success: false,
      error: error.code === "23505" ? "Bu isimde bir ürün zaten var." : "Ürün güncellenemedi.",
    };
  }

  await logAudit(supabase, {
    userId: profile.id,
    action: "menu_product.update",
    entityType: "menu_products",
    entityId: id,
    oldValue: before,
    newValue: parsed.data,
  });

  revalidatePath("/menu-products");
  return { success: true };
}

export async function saveRecipeVersion(
  menuProductId: string,
  input: RecipeInput,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = recipeFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Geçersiz reçete verisi." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_create_recipe_version", {
    p_menu_product_id: menuProductId,
    p_items: parsed.data.items.map((line) => ({
      inventory_item_id: line.inventory_item_id,
      quantity: line.quantity,
    })),
    p_notes: parsed.data.notes || null,
  });

  if (error) {
    return { success: false, error: "Reçete kaydedilemedi: " + error.message };
  }

  void data;
  revalidatePath(`/menu-products/${menuProductId}/recipe`);
  return { success: true };
}
