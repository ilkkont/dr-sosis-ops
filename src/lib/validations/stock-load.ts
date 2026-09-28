import { z } from "zod";

export const stockLoadLineSchema = z.object({
  inventory_item_id: z.string(),
  quantity: z.coerce.number().min(0).optional(),
  unit_choice: z.enum(["base", "kg"]),
});

export const stockLoadFormSchema = z.object({
  lines: z.array(stockLoadLineSchema),
});

export type StockLoadFormInput = z.input<typeof stockLoadFormSchema>;
export type StockLoadInput = z.output<typeof stockLoadFormSchema>;
