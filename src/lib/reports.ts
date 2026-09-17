/**
 * Rapor sayfası için saf (side-effect'siz) toplulaştırma fonksiyonları.
 * Girdi satırları Supabase'ten okunur; burada yalnızca görüntüleme amaçlı
 * gruplama/toplama yapılır (yazma/iş kuralı hesapları her zaman Postgres
 * fonksiyonlarında kalır).
 */

export type SalesLineRow = {
  quantity: number;
  event_date: string;
  caravan_name: string;
  event_name: string;
  product_name: string;
};

export type ConsumptionRow = {
  quantity_base: number; // negatif (tüketim)
  event_date: string;
  caravan_name: string;
  item_name: string;
};

export type VarianceRow = {
  event_date: string;
  event_name: string;
  caravan_name: string;
  item_name: string;
  variance_qty: number;
  variance_pct: number | null;
};

export type WasteRow = {
  event_date: string;
  caravan_name: string;
  item_name: string;
  waste_type: string;
  quantity_base: number;
};

export type GroupTotal = { key: string; total: number };

function groupSum<T>(rows: T[], keyFn: (row: T) => string, valueFn: (row: T) => number): GroupTotal[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    totals.set(key, (totals.get(key) ?? 0) + valueFn(row));
  }
  return Array.from(totals.entries())
    .map(([key, total]) => ({ key, total }))
    .sort((a, b) => b.total - a.total);
}

export function salesByDay(rows: SalesLineRow[]): GroupTotal[] {
  return groupSum(rows, (r) => r.event_date, (r) => r.quantity).sort((a, b) =>
    a.key.localeCompare(b.key),
  );
}

export function salesByCaravan(rows: SalesLineRow[]): GroupTotal[] {
  return groupSum(rows, (r) => r.caravan_name, (r) => r.quantity);
}

export function salesByEvent(rows: SalesLineRow[]): GroupTotal[] {
  return groupSum(rows, (r) => `${r.event_name} (${r.event_date})`, (r) => r.quantity);
}

export function salesByProduct(rows: SalesLineRow[]): GroupTotal[] {
  return groupSum(rows, (r) => r.product_name, (r) => r.quantity);
}

export function topProducts(rows: SalesLineRow[], limit = 5): GroupTotal[] {
  return salesByProduct(rows).slice(0, limit);
}

export function totalSold(rows: SalesLineRow[]): number {
  return rows.reduce((sum, r) => sum + r.quantity, 0);
}

export function consumptionByItem(rows: ConsumptionRow[]): GroupTotal[] {
  return groupSum(rows, (r) => r.item_name, (r) => Math.abs(r.quantity_base));
}

export function topConsumedItems(rows: ConsumptionRow[], limit = 5): GroupTotal[] {
  return consumptionByItem(rows).slice(0, limit);
}

export function consumptionByCaravan(rows: ConsumptionRow[]): GroupTotal[] {
  return groupSum(rows, (r) => r.caravan_name, (r) => Math.abs(r.quantity_base));
}

export function wasteByType(rows: WasteRow[]): GroupTotal[] {
  return groupSum(rows, (r) => r.waste_type, (r) => r.quantity_base);
}

export function wasteByItem(rows: WasteRow[]): GroupTotal[] {
  return groupSum(rows, (r) => r.item_name, (r) => r.quantity_base);
}

export function significantVariances(rows: VarianceRow[]): VarianceRow[] {
  return rows
    .filter((r) => r.variance_qty !== 0)
    .sort((a, b) => Math.abs(b.variance_qty) - Math.abs(a.variance_qty));
}

/** Karavan bazında satış ve tüketimi tek tabloda karşılaştırır. */
export function caravanComparison(
  salesRows: SalesLineRow[],
  consumptionRows: ConsumptionRow[],
): { caravan: string; sold: number; consumed: number }[] {
  const sold = new Map(salesByCaravan(salesRows).map((g) => [g.key, g.total]));
  const consumed = new Map(consumptionByCaravan(consumptionRows).map((g) => [g.key, g.total]));
  const caravans = new Set([...sold.keys(), ...consumed.keys()]);
  return Array.from(caravans)
    .map((caravan) => ({
      caravan,
      sold: sold.get(caravan) ?? 0,
      consumed: consumed.get(caravan) ?? 0,
    }))
    .sort((a, b) => b.sold - a.sold);
}
