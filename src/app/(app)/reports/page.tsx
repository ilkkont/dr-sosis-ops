import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { ReportFilters } from "./report-filters";
import { ReportsView } from "./reports-view";
import type { SalesLineRow, ConsumptionRow, VarianceRow, WasteRow } from "@/lib/reports";

export const metadata: Metadata = {
  title: "Raporlar | Dr.Sosis Operasyon Paneli",
};

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; caravan?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const defaults = defaultDateRange();
  const from = params.from ?? defaults.from;
  const to = params.to ?? defaults.to;
  const caravanId = params.caravan ?? "all";

  const supabase = await createClient();

  const { data: caravans } = await supabase.from("caravans").select("id, name").order("name");

  let salesQuery = supabase
    .from("sales_lines")
    .select(
      "quantity, menu_products(name), sales_batches!inner(status, events!inner(event_date, name, caravan_id, caravans(name)))",
    )
    .eq("sales_batches.status", "finalized")
    .gte("sales_batches.events.event_date", from)
    .lte("sales_batches.events.event_date", to);
  if (caravanId !== "all") {
    salesQuery = salesQuery.eq("sales_batches.events.caravan_id", caravanId);
  }

  let consumptionQuery = supabase
    .from("stock_movements")
    .select("quantity_base, inventory_items(name), events!inner(event_date, caravan_id, caravans(name))")
    .eq("movement_type", "recipe_consumption")
    .gte("events.event_date", from)
    .lte("events.event_date", to);
  if (caravanId !== "all") {
    consumptionQuery = consumptionQuery.eq("events.caravan_id", caravanId);
  }

  let varianceQuery = supabase
    .from("stock_count_lines")
    .select(
      "variance_qty, variance_pct, inventory_items(name), stock_counts!inner(status, events!inner(event_date, name, caravan_id, caravans(name)))",
    )
    .eq("stock_counts.status", "finalized")
    .gte("stock_counts.events.event_date", from)
    .lte("stock_counts.events.event_date", to);
  if (caravanId !== "all") {
    varianceQuery = varianceQuery.eq("stock_counts.events.caravan_id", caravanId);
  }

  let wasteQuery = supabase
    .from("waste_records")
    .select("quantity_base, waste_type, inventory_items(name), events!inner(event_date, caravan_id, caravans(name))")
    .gte("events.event_date", from)
    .lte("events.event_date", to);
  if (caravanId !== "all") {
    wasteQuery = wasteQuery.eq("events.caravan_id", caravanId);
  }

  const [{ data: salesRaw }, { data: consumptionRaw }, { data: varianceRaw }, { data: wasteRaw }] =
    await Promise.all([salesQuery, consumptionQuery, varianceQuery, wasteQuery]);

  const sales: SalesLineRow[] = (salesRaw ?? []).map((row) => ({
    quantity: row.quantity,
    event_date: row.sales_batches.events.event_date,
    caravan_name: row.sales_batches.events.caravans?.name ?? "—",
    event_name: row.sales_batches.events.name,
    product_name: row.menu_products?.name ?? "—",
  }));

  const consumption: ConsumptionRow[] = (consumptionRaw ?? []).map((row) => ({
    quantity_base: row.quantity_base,
    event_date: row.events.event_date,
    caravan_name: row.events.caravans?.name ?? "—",
    item_name: row.inventory_items?.name ?? "—",
  }));

  const variances: VarianceRow[] = (varianceRaw ?? []).map((row) => ({
    event_date: row.stock_counts.events.event_date,
    event_name: row.stock_counts.events.name,
    caravan_name: row.stock_counts.events.caravans?.name ?? "—",
    item_name: row.inventory_items?.name ?? "—",
    variance_qty: row.variance_qty,
    variance_pct: row.variance_pct,
  }));

  const waste: WasteRow[] = (wasteRaw ?? []).map((row) => ({
    event_date: row.events.event_date,
    caravan_name: row.events.caravans?.name ?? "—",
    item_name: row.inventory_items?.name ?? "—",
    waste_type: row.waste_type,
    quantity_base: row.quantity_base,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-foreground">RAPORLAR</h1>
        <p className="text-muted-foreground">
          Seçilen tarih aralığı ve karavan için satış, tüketim, fire/ikram ve stok farkı
          raporları.
        </p>
      </div>

      <ReportFilters caravans={caravans ?? []} from={from} to={to} caravanId={caravanId} />

      <ReportsView sales={sales} consumption={consumption} variances={variances} waste={waste} />
    </div>
  );
}
