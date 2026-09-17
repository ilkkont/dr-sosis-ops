"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { caravanSchema, type CaravanInput } from "@/lib/validations/caravan";

export type ActionResult = { success: true } | { success: false; error: string };

export async function createCaravan(input: CaravanInput): Promise<ActionResult> {
  const profile = await requireAdmin();

  const parsed = caravanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Geçersiz form verisi." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("caravans")
    .insert({
      name: parsed.data.name,
      plate: parsed.data.plate || null,
      status: parsed.data.status,
      description: parsed.data.description || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Karavan oluşturulamadı." };
  }

  await logAudit(supabase, {
    userId: profile.id,
    action: "caravan.create",
    entityType: "caravans",
    entityId: data.id,
    newValue: parsed.data,
  });

  revalidatePath("/caravans");
  return { success: true };
}

export async function updateCaravan(
  id: string,
  input: CaravanInput,
): Promise<ActionResult> {
  const profile = await requireAdmin();

  const parsed = caravanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Geçersiz form verisi." };
  }

  const supabase = await createClient();

  const { data: before } = await supabase
    .from("caravans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("caravans")
    .update({
      name: parsed.data.name,
      plate: parsed.data.plate || null,
      status: parsed.data.status,
      description: parsed.data.description || null,
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Karavan güncellenemedi." };
  }

  await logAudit(supabase, {
    userId: profile.id,
    action: "caravan.update",
    entityType: "caravans",
    entityId: id,
    oldValue: before,
    newValue: parsed.data,
  });

  revalidatePath("/caravans");
  return { success: true };
}
