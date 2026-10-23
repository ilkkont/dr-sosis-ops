import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ITEM_WITH_CATEGORY_SELECT,
  sortItemsByCategory,
  type ItemWithCategory,
} from "@/lib/inventory";
import { CaravanStockForm } from "./caravan-stock-form";
import { CaravanMovementsLog } from "./caravan-movements-log";

export const metadata: Metadata = {
  title: "Karavan Stokları | Dr.Sosis Operasyon Paneli",
};

export default async function CaravanStockPage({
  searchParams,
}: {
  searchParams: Promise<{ caravan?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const supabase = await createClient();

  const { data: caravans } = await supabase.from("caravans").select("id, name, status").order("name");
  const caravanList = caravans ?? [];
  const selected = caravanList.find((c) => c.id === params.caravan) ?? caravanList[0];

  if (!selected) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl tracking-wide text-foreground">KARAVAN STOKLARI</h1>
        <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Henüz karavan yok. Önce Karavanlar sayfasından bir karavan ekleyin.
        </p>
      </div>
    );
  }

  const [{ data: items }, { data: balances }, { data: movements }] = await Promise.all([
    supabase.from("inventory_items").select(ITEM_WITH_CATEGORY_SELECT).eq("is_active", true),
    supabase
      .from("v_caravan_stock_balances")
      .select("inventory_item_id, balance")
      .eq("caravan_id", selected.id),
    supabase
      .from("caravan_stock_movements")
      .select("*, inventory_items(name, unit_type, portion_kg_factor, unit_label, pack_size)")
      .eq("caravan_id", selected.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const balanceByItem = Object.fromEntries(
    (balances ?? []).map((b) => [b.inventory_item_id, b.balance]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-foreground">KARAVAN STOKLARI</h1>
        <p className="text-muted-foreground">
          Her karavanın kendi stoğu. Miktarı elle girip kaydedin; her değişiklik geçmişte
          kayıt olarak tutulur.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {caravanList.map((caravan) => (
          <Button
            key={caravan.id}
            variant={caravan.id === selected.id ? "default" : "outline"}
            className={caravan.id === selected.id ? "bg-red text-white hover:bg-red-deep" : ""}
            render={<Link href={`/caravan-stock?caravan=${caravan.id}`} />}
          >
            {caravan.name}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-display text-xl tracking-wide text-foreground">
            {selected.name.toUpperCase()} — MEVCUT STOK
          </h2>
        </CardHeader>
        <CardContent>
          <CaravanStockForm
            key={selected.id}
            caravanId={selected.id}
            items={sortItemsByCategory((items ?? []) as ItemWithCategory[])}
            balanceByItem={balanceByItem}
          />
        </CardContent>
      </Card>

      <CaravanMovementsLog movements={movements ?? []} />
    </div>
  );
}
