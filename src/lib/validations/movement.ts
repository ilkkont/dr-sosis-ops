import { z } from "zod";

export const movementKindSchema = z.enum([
  "additional_entry",
  "return_to_depot",
  "transfer",
  "fire",
  "complimentary",
  "staff_meal",
  "defective",
]);

export const MOVEMENT_KIND_LABELS: Record<z.infer<typeof movementKindSchema>, string> = {
  additional_entry: "Ek Stok Girişi",
  return_to_depot: "Depoya İade",
  transfer: "Karavanlar Arası Transfer",
  fire: "Fire",
  complimentary: "İkram",
  staff_meal: "Personel Yemeği",
  defective: "Hatalı Ürün",
};

export const movementFormSchema = z
  .object({
    kind: movementKindSchema,
    inventory_item_id: z.string().min(1, { message: "Malzeme seçin." }),
    quantity: z.coerce.number().positive({ message: "Miktar 0'dan büyük olmalı." }),
    unit_choice: z.enum(["base", "kg"]),
    reason: z.string().max(300).optional().or(z.literal("")),
    target_event_id: z.string().optional().or(z.literal("")),
  })
  .refine((data) => data.kind !== "transfer" || Boolean(data.target_event_id), {
    message: "Transfer için hedef etkinlik/karavan seçin.",
    path: ["target_event_id"],
  });

export type MovementFormInput = z.input<typeof movementFormSchema>;
export type MovementInput = z.output<typeof movementFormSchema>;
