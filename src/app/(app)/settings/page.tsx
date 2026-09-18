import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { negativeStockPolicySchema } from "@/lib/validations/settings";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Ayarlar | Dr.Sosis Operasyon Paneli",
};

export default async function SettingsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .eq("key", "negative_stock_policy")
    .maybeSingle();

  const parsedPolicy = negativeStockPolicySchema.safeParse(data?.value);
  const negativeStockPolicy = parsedPolicy.success ? parsedPolicy.data : "warn_allow";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-foreground">AYARLAR</h1>
        <p className="text-muted-foreground">Uygulama genelindeki davranışları yönetin.</p>
      </div>

      <SettingsForm negativeStockPolicy={negativeStockPolicy} />
    </div>
  );
}
