"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type NegativeStockItem = {
  inventory_item_id: string;
  current: number;
  needed: number;
};

export type DraftSaveResult =
  | { success: true; batchId: string }
  | { success: false; error: string };

export type FinalizeResult =
  | { success: true; status: "finalized" | "already_finalized" }
  | { success: true; status: "would_go_negative"; items: NegativeStockItem[] }
  | { success: false; error: string };

function parseFinalizeResponse(data: unknown): FinalizeResult {
  const result = data as { status?: string; items?: NegativeStockItem[] } | null;
  if (!result?.status) {
    return { success: false, error: "Beklenmeyen sunucu yanıtı." };
  }
  if (result.status === "would_go_negative") {
    return { success: true, status: "would_go_negative", items: result.items ?? [] };
  }
  if (result.status === "finalized" || result.status === "already_finalized") {
    return { success: true, status: result.status };
  }
  return { success: false, error: "Beklenmeyen sunucu yanıtı." };
}

export async function saveDraftSales(
  eventId: string,
  idempotencyKey: string,
  lines: { menu_product_id: string; quantity: number }[],
): Promise<DraftSaveResult> {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("caravan_id")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) {
    return { success: false, error: "Etkinlik bulunamadı." };
  }

  const { data: existing } = await supabase
    .from("sales_batches")
    .select("id, status")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && existing.status !== "draft") {
    return {
      success: false,
      error: "Bu etkinlik için satış zaten kesinleşmiş. Düzeltme akışını kullanın.",
    };
  }

  let batchId = existing?.id ?? null;
  if (!batchId) {
    const { data: created, error } = await supabase
      .from("sales_batches")
      .insert({
        event_id: eventId,
        caravan_id: event.caravan_id,
        idempotency_key: idempotencyKey,
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (error || !created) {
      return { success: false, error: "Taslak oluşturulamadı." };
    }
    batchId = created.id;
  }

  const { error: deleteError } = await supabase
    .from("sales_lines")
    .delete()
    .eq("sales_batch_id", batchId);
  if (deleteError) {
    return { success: false, error: "Taslak kaydedilemedi." };
  }

  const rows = lines
    .filter((line) => line.quantity > 0)
    .map((line) => ({
      sales_batch_id: batchId!,
      menu_product_id: line.menu_product_id,
      quantity: line.quantity,
    }));

  if (rows.length > 0) {
    const { error } = await supabase.from("sales_lines").insert(rows);
    if (error) {
      return { success: false, error: "Taslak kaydedilemedi." };
    }
  }

  revalidatePath(`/events/${eventId}/sales`);
  return { success: true, batchId };
}

export async function finalizeSales(
  eventId: string,
  batchId: string,
  overrideNegative = false,
): Promise<FinalizeResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("fn_finalize_sales_batch", {
    p_batch_id: batchId,
    p_override_negative: overrideNegative,
  });

  if (error) {
    return {
      success: false,
      error: error.message.includes("Yetersiz stok")
        ? "Yetersiz stok: negatif stok politikası bu satışı engelliyor."
        : "Satış kesinleştirilemedi: " + error.message,
    };
  }

  revalidatePath(`/events/${eventId}/sales`);
  revalidatePath(`/events/${eventId}`);
  return parseFinalizeResponse(data);
}

export async function correctSales(
  eventId: string,
  oldBatchId: string,
  idempotencyKey: string,
  lines: { menu_product_id: string; quantity: number }[],
  overrideNegative = false,
): Promise<FinalizeResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("fn_correct_sales_batch", {
    p_old_batch_id: oldBatchId,
    p_new_lines: lines,
    p_idempotency_key: idempotencyKey,
    p_override_negative: overrideNegative,
  });

  if (error) {
    return {
      success: false,
      error: error.message.includes("Yetersiz stok")
        ? "Yetersiz stok: negatif stok politikası bu düzeltmeyi engelliyor."
        : "Satış düzeltilemedi: " + error.message,
    };
  }

  revalidatePath(`/events/${eventId}/sales`);
  revalidatePath(`/events/${eventId}`);
  return parseFinalizeResponse(data);
}
