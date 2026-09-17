import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { MENU_CATEGORY_LABELS } from "@/lib/validations/menu-product";
import { RecipeEditor } from "./recipe-editor";
import { RecipeHistory } from "./recipe-history";

export const metadata: Metadata = {
  title: "Reçete Düzenle | Dr.Sosis Operasyon Paneli",
};

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("menu_products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    notFound();
  }

  const [{ data: inventoryItems }, { data: activeVersion }, { data: versions }] =
    await Promise.all([
      supabase
        .from("inventory_items")
        .select("id, name, unit_type, is_active")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("recipe_versions")
        .select("*, recipe_items(*, inventory_items(id, name, unit_type))")
        .eq("menu_product_id", id)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("recipe_versions")
        .select("id, version_no, valid_from, valid_to, is_active, notes")
        .eq("menu_product_id", id)
        .order("version_no", { ascending: false }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/menu-products" />}>
          <ArrowLeft className="size-4" />
          Menü Ürünlerine Dön
        </Button>
      </div>

      <div>
        <h1 className="font-display text-3xl tracking-wide text-foreground">
          {product.name.toUpperCase()}
        </h1>
        <p className="text-muted-foreground">
          {MENU_CATEGORY_LABELS[product.category]} — Reçete versiyon{" "}
          {activeVersion?.version_no ?? "yok"}
        </p>
      </div>

      <RecipeEditor
        menuProductId={product.id}
        inventoryItems={inventoryItems ?? []}
        activeItems={
          activeVersion?.recipe_items.map((ri) => ({
            inventory_item_id: ri.inventory_item_id,
            quantity: ri.quantity,
          })) ?? []
        }
        activeNotes={activeVersion?.notes ?? ""}
      />

      <RecipeHistory versions={versions ?? []} />
    </div>
  );
}
