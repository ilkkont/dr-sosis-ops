import { z } from "zod";

export const caravanSchema = z.object({
  name: z.string().min(1, { message: "Karavan adı gerekli." }).max(100),
  plate: z.string().max(20).optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "maintenance"]),
  description: z.string().max(500).optional().or(z.literal("")),
});

export type CaravanInput = z.infer<typeof caravanSchema>;

export const CARAVAN_STATUS_LABELS: Record<CaravanInput["status"], string> = {
  active: "Aktif",
  inactive: "Pasif",
  maintenance: "Bakımda",
};
