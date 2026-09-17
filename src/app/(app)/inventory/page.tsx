import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { InventoryFormDialog } from "./inventory-form-dialog";
import { InventoryTable } from "./inventory-table";

export const metadata: Metadata = {
  title: "Stok Kalemleri | Dr.Sosis Operasyon Paneli",
};

export default async function InventoryPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("inventory_items")
    .select("*")
    .order("category")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-foreground">
            STOK KALEMLERİ
          </h1>
          <p className="text-muted-foreground">
            Ad, kategori, birim, dönüşüm katsayısı ve kritik stok seviyesi yönetimi.
          </p>
        </div>
        <InventoryFormDialog
          trigger={
            <Button className="bg-red text-white hover:bg-red-deep">
              <Plus className="size-4" />
              Yeni Kalem
            </Button>
          }
        />
      </div>

      <InventoryTable items={items ?? []} />
    </div>
  );
}
