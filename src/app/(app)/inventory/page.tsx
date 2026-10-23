import type { Metadata } from "next";
import { Plus, Tags } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { InventoryFormDialog } from "./inventory-form-dialog";
import { InventoryTable } from "./inventory-table";
import { CategoriesDialog } from "./categories-dialog";
import { ITEM_WITH_CATEGORY_SELECT, sortItemsByCategory, type ItemWithCategory } from "@/lib/inventory";

export const metadata: Metadata = {
  title: "Stok Kalemleri | Dr.Sosis Operasyon Paneli",
};

export default async function InventoryPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: items }, { data: categories }] = await Promise.all([
    supabase.from("inventory_items").select(ITEM_WITH_CATEGORY_SELECT),
    supabase.from("inventory_categories").select("*").order("sort_order").order("name"),
  ]);
  const sortedItems = sortItemsByCategory((items ?? []) as ItemWithCategory[]);

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
        <div className="flex gap-2">
          <CategoriesDialog
            categories={categories ?? []}
            trigger={
              <Button variant="outline">
                <Tags className="size-4" />
                Kategoriler
              </Button>
            }
          />
          <InventoryFormDialog
            categories={categories ?? []}
            trigger={
              <Button className="bg-red text-white hover:bg-red-deep">
                <Plus className="size-4" />
                Yeni Kalem
              </Button>
            }
          />
        </div>
      </div>

      <InventoryTable items={sortedItems} categories={categories ?? []} />
    </div>
  );
}
