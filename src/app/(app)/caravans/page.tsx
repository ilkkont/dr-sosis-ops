import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CaravanFormDialog } from "./caravan-form-dialog";
import { CaravansTable } from "./caravans-table";

export const metadata: Metadata = {
  title: "Karavanlar | Dr.Sosis Operasyon Paneli",
};

export default async function CaravansPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: caravans } = await supabase
    .from("caravans")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-foreground">KARAVANLAR</h1>
          <p className="text-muted-foreground">Karavan adı, plaka, durum ve açıklama yönetimi.</p>
        </div>
        <CaravanFormDialog
          trigger={
            <Button className="bg-red text-white hover:bg-red-deep">
              <Plus className="size-4" />
              Yeni Karavan
            </Button>
          }
        />
      </div>

      <CaravansTable caravans={caravans ?? []} />
    </div>
  );
}
