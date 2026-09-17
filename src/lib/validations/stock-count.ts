import { z } from "zod";

export const stockCountLineSchema = z.object({
  inventory_item_id: z.string(),
  physical_qty: z.coerce.number().min(0).optional(),
  note: z.string().max(200).optional().or(z.literal("")),
});

export const stockCountFormSchema = z.object({
  lines: z.array(stockCountLineSchema),
});

export type StockCountFormInput = z.input<typeof stockCountFormSchema>;
export type StockCountInput = z.output<typeof stockCountFormSchema>;
