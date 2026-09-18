import { z } from "zod";

export const negativeStockPolicySchema = z.enum(["block", "warn_allow"]);

export type NegativeStockPolicy = z.infer<typeof negativeStockPolicySchema>;

export const NEGATIVE_STOCK_POLICY_LABELS: Record<NegativeStockPolicy, string> = {
  block: "Engelle",
  warn_allow: "Uyar ve İzin Ver",
};

export const NEGATIVE_STOCK_POLICY_DESCRIPTIONS: Record<NegativeStockPolicy, string> = {
  block: "Bir satış, stoğu negatife düşürecekse kesinleştirme reddedilir.",
  warn_allow:
    "Bir satış stoğu negatife düşürecekse önce uyarı gösterilir; admin onaylarsa işlem tamamlanır.",
};
