import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { MenuProductFormDialog } from "./menu-product-form-dialog";
import { MenuProductsTable } from "./menu-products-table";

export const metadata: Metadata = {
  title: "Menü Ürünleri | Dr.Sosis Operasyon Paneli",
};

export default async function MenuProductsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("menu_products")
    .select("*")
    .order("display_order");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-foreground">
            MENÜ ÜRÜNLERİ
          </h1>
          <p className="text-muted-foreground">
            Ürün yönetimi ve versiyonlu reçete düzenleme (şef şapkası simgesi).
          </p>
        </div>
        <MenuProductFormDialog
          trigger={
            <Button className="bg-red text-white hover:bg-red-deep">
              <Plus className="size-4" />
              Yeni Ürün
            </Button>
          }
        />
      </div>

      <MenuProductsTable products={products ?? []} />
    </div>
  );
}
