import { z } from "zod";

export const inventoryCategorySchema = z.enum([
  "bread",
  "sausage",
  "cheese",
  "sauce",
  "topping",
  "drink",
  "packaging",
  "produce",
  "other",
]);

export const INVENTORY_CATEGORY_LABELS: Record<z.infer<typeof inventoryCategorySchema>, string> = {
  bread: "Ekmek",
  sausage: "Sosis",
  cheese: "Peynir",
  sauce: "Sos",
  topping: "Garnitür",
  drink: "İçecek",
  packaging: "Paketleme",
  produce: "Sebze/Diğer Gıda",
  other: "Diğer",
};

export const UNIT_TYPE_LABELS: Record<"count" | "weight" | "portion", string> = {
  count: "Adet",
  weight: "Gram",
  portion: "Porsiyon",
};

export const inventoryItemSchema = z
  .object({
    name: z.string().min(1, { message: "Ad gerekli." }).max(100),
    category: inventoryCategorySchema,
    unit_type: z.enum(["count", "weight", "portion"]),
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

// Ana birime göre giriş formunda gösterilecek varsayılan birim: adet
// kalemler her zaman adet, gram kalemler gram (kg toggle UI'da sabit ×1000),
// porsiyon kalemler porsiyon (kg toggle katsayısı yönetilebilir).
export function defaultDisplayUnit(
  unitType: InventoryItemInput["unit_type"],
): "unit" | "gram" | "portion" {
  if (unitType === "count") return "unit";
  if (unitType === "weight") return "gram";
  return "portion";
}
