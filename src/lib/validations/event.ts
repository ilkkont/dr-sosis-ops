import { z } from "zod";

export const eventStatusSchema = z.enum(["preparation", "open", "closed", "cancelled"]);

export const EVENT_STATUS_LABELS: Record<z.infer<typeof eventStatusSchema>, string> = {
  preparation: "Hazırlık",
  open: "Açık",
  closed: "Kapandı",
  cancelled: "İptal",
};

export const eventFormSchema = z
  .object({
    event_date: z.string().min(1, { message: "Tarih gerekli." }),
    name: z.string().min(1, { message: "Etkinlik adı gerekli." }).max(150),
    location: z.string().max(200).optional().or(z.literal("")),
    caravan_id: z.string().min(1, { message: "Karavan seçin." }),
    start_time: z.string().min(1, { message: "Başlangıç saati gerekli." }),
    end_time: z.string().min(1, { message: "Bitiş saati gerekli." }),
    expected_attendance: z.coerce.number().int().min(0).optional(),
    responsible_person: z.string().max(150).optional().or(z.literal("")),
    note: z.string().max(1000).optional().or(z.literal("")),
    status: eventStatusSchema,
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "Bitiş saati başlangıçtan sonra olmalı.",
    path: ["end_time"],
  });

export type EventFormInput = z.input<typeof eventFormSchema>;
export type EventInput = z.output<typeof eventFormSchema>;
