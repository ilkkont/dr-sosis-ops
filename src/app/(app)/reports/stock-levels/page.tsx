import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  ITEM_WITH_CATEGORY_SELECT,
  categoryName,
  sortItemsByCategory,
  type ItemWithCategory,
} from "@/lib/inventory";
import { formatQuantity } from "@/lib/units";
import { stockLevelsMatrix } from "@/lib/reports";
import { StockLevelsView } from "./stock-levels-view";

export const metadata: Metadata = {
  title: "Stok Durumu | Dr.Sosis Operasyon Paneli",
};

export default async function StockLevelsPage({
  searchParams,
}: {
  searchParams: Promise<{ caravan?: string; zero?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const caravanFilter = params.caravan ?? "all";
  const showZero = params.zero === "show";

  const supabase = await createClient();

  const [{ data: caravans }, { data: items }, { data: depotBalances }, { data: caravanBalances }] =
    await Promise.all([
      supabase.from("caravans").select("id, name").order("name"),
      supabase.from("inventory_items").select(ITEM_WITH_CATEGORY_SELECT),
      supabase.from("v_depot_balances").select("inventory_item_id, balance"),
      supabase.from("v_caravan_stock_balances").select("caravan_id, inventory_item_id, balance"),
    ]);

  const allCaravans = caravans ?? [];
  const visibleCaravans =
    caravanFilter === "all" ? allCaravans : allCaravans.filter((c) => c.id === caravanFilter);
  const visibleIds = new Set(visibleCaravans.map((c) => c.id));

  const sortedItems = sortItemsByCategory((items ?? []) as ItemWithCategory[]);
  const itemById = new Map(sortedItems.map((item) => [item.id, item]));

  const matrix = stockLevelsMatrix(
    sortedItems.map((item) => item.id),
    depotBalances ?? [],
    (caravanBalances ?? []).filter((b) => visibleIds.has(b.caravan_id)),
    !showZero,
  );

  const headers = ["Kategori", "Kalem", "Ana Depo", ...visibleCaravans.map((c) => c.name), "Toplam"];
  const rows = matrix.map((row) => {
    const item = itemById.get(row.itemId)!;
    const cell = (value: number) => (value === 0 ? "—" : formatQuantity(item, value));
    return [
      categoryName(item),
      item.name,
      cell(row.depot),
      ...visibleCaravans.map((c) => cell(row.caravans[c.id] ?? 0)),
      cell(row.total),
    ];
  });

  const base = new URLSearchParams();
  if (showZero) base.set("zero", "show");
  const caravanHref = (id: string) => {
    const query = new URLSearchParams(base);
    if (id !== "all") query.set("caravan", id);
    return `/reports/stock-levels?${query.toString()}`;
  };
  const zeroQuery = new URLSearchParams();
  if (caravanFilter !== "all") zeroQuery.set("caravan", caravanFilter);
  if (!showZero) zeroQuery.set("zero", "show");

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/reports" />}>
          <ArrowLeft className="size-4" />
          Raporlara Dön
        </Button>
      </div>

      <div>
        <h1 className="font-display text-3xl tracking-wide text-foreground">STOK DURUMU</h1>
        <p className="text-muted-foreground">
          Ana depo ve karavan stoklarının güncel miktarları (etkinliklerin içindeki stok
          dahil değildir).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={caravanFilter === "all" ? "default" : "outline"}
          className={caravanFilter === "all" ? "bg-red text-white hover:bg-red-deep" : ""}
          render={<Link href={caravanHref("all")} />}
        >
          Tüm Karavanlar
        </Button>
        {allCaravans.map((caravan) => (
          <Button
            key={caravan.id}
            variant={caravanFilter === caravan.id ? "default" : "outline"}
            className={caravanFilter === caravan.id ? "bg-red text-white hover:bg-red-deep" : ""}
            render={<Link href={caravanHref(caravan.id)} />}
          >
            {caravan.name}
          </Button>
        ))}
        <Button
          variant="ghost"
          render={<Link href={`/reports/stock-levels?${zeroQuery.toString()}`} />}
        >
          {showZero ? "Sıfır olanları gizle" : "Sıfır olanları göster"}
        </Button>
      </div>

      <StockLevelsView headers={headers} rows={rows} />
    </div>
  );
}
