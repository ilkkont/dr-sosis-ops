import { z } from "zod";
import { stockLoadLineSchema } from "./stock-load";

export const depotStockEntryFormSchema = z.object({
  lines: z.array(stockLoadLineSchema),
  description: z.string().max(300).optional().or(z.literal("")),
});

export type DepotStockEntryFormInput = z.input<typeof depotStockEntryFormSchema>;
export type DepotStockEntryInput = z.output<typeof depotStockEntryFormSchema>;
