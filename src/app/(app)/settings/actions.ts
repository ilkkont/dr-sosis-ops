"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { negativeStockPolicySchema } from "@/lib/validations/settings";

export type ActionResult = { success: true } | { success: false; error: string };

export async function updateNegativeStockPolicy(value: string): Promise<ActionResult> {
  const profile = await requireAdmin();

  const parsed = negativeStockPolicySchema.safeParse(value);
  if (!parsed.success) {
    return { success: false, error: "Geçersiz değer." };
  }

  const supabase = await createClient();

  const { data: before } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "negative_stock_policy")
    .maybeSingle();

  const { error } = await supabase
    .from("app_settings")
    .update({ value: parsed.data, updated_by: profile.id })
    .eq("key", "negative_stock_policy");

  if (error) {
    return { success: false, error: "Ayar güncellenemedi." };
  }

  await logAudit(supabase, {
    userId: profile.id,
    action: "settings.update",
    entityType: "app_settings",
    oldValue: before?.value ?? null,
    newValue: parsed.data,
  });

  revalidatePath("/settings");
  return { success: true };
}
