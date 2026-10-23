import { z } from "zod";

export const UNIT_TYPE_LABELS: Record<"count" | "weight" | "portion", string> = {
  count: "Adet",
  weight: "Gram",
  portion: "Porsiyon",
};

export const inventoryItemSchema = z
  .object({
    name: z.string().min(1, { message: "Ad gerekli." }).max(100),
    category_id: z.string().min(1, { message: "Kategori seçin." }),
    unit_type: z.enum(["count", "weight", "portion"]),
    unit_label: z.string().max(30).optional().or(z.literal("")),
    pack_size: z.coerce.number().positive().optional(),
    portion_kg_factor: z.coerce.number().positive().optional(),
    critical_level: z.coerce.number().min(0, { message: "Kritik seviye 0 veya üzeri olmalı." }),
    is_active: z.boolean(),
  })
  .refine(
    (data) => data.unit_type !== "portion" || (data.portion_kg_factor ?? 0) > 0,
    {
      message: "Porsiyon bazlı kalemler için kg→porsiyon katsayısı gerekli.",
      path: ["portion_kg_factor"],
    },
  );

// react-hook-form + zodResolver: `z.coerce.number()` alanları formdan önce
// string/unknown, resolver sonrası number olur — bu yüzden form (Input) ve
// submit sonrası (Output) tiplerini ayrı tutuyoruz.
export type InventoryItemFormInput = z.input<typeof inventoryItemSchema>;
export type InventoryItemInput = z.output<typeof inventoryItemSchema>;

export const inventoryCategorySchema = z.object({
  name: z.string().min(1, { message: "Kategori adı gerekli." }).max(60),
  sort_order: z.coerce.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

export type InventoryCategoryFormInput = z.input<typeof inventoryCategorySchema>;
export type InventoryCategoryInput = z.output<typeof inventoryCategorySchema>;

// Ana birime göre veritabanındaki varsayılan giriş birimi sütunu: sayma
// kalemleri her zaman adet, gram kalemleri gram, porsiyon kalemleri porsiyon.
export function defaultDisplayUnit(
  unitType: InventoryItemInput["unit_type"],
): "unit" | "gram" | "portion" {
  if (unitType === "count") return "unit";
  if (unitType === "weight") return "gram";
  return "portion";
}
