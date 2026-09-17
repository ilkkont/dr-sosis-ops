import { describe, expect, it } from "vitest";
import {
  salesByDay,
  salesByCaravan,
  salesByProduct,
  topProducts,
  totalSold,
  consumptionByItem,
  topConsumedItems,
  wasteByType,
  significantVariances,
  caravanComparison,
  type SalesLineRow,
  type ConsumptionRow,
  type VarianceRow,
  type WasteRow,
} from "@/lib/reports";

const sales: SalesLineRow[] = [
  { quantity: 10, event_date: "2026-08-01", caravan_name: "Karavan 1", event_name: "Festival A", product_name: "Klasik Frankfurter" },
  { quantity: 5, event_date: "2026-08-01", caravan_name: "Karavan 1", event_name: "Festival A", product_name: "Cheddarlı Frankfurter" },
  { quantity: 20, event_date: "2026-08-02", caravan_name: "Karavan 2", event_name: "Festival B", product_name: "Klasik Frankfurter" },
];

describe("salesByDay", () => {
  it("groups and sorts by date ascending", () => {
    expect(salesByDay(sales)).toEqual([
      { key: "2026-08-01", total: 15 },
      { key: "2026-08-02", total: 20 },
    ]);
  });
});

describe("salesByCaravan / salesByProduct", () => {
  it("sums quantities per caravan, sorted descending", () => {
    expect(salesByCaravan(sales)).toEqual([
      { key: "Karavan 2", total: 20 },
      { key: "Karavan 1", total: 15 },
    ]);
  });

  it("sums quantities per product", () => {
    expect(salesByProduct(sales)).toEqual([
      { key: "Klasik Frankfurter", total: 30 },
      { key: "Cheddarlı Frankfurter", total: 5 },
    ]);
  });
});

describe("topProducts / totalSold", () => {
  it("limits to top N", () => {
    expect(topProducts(sales, 1)).toEqual([{ key: "Klasik Frankfurter", total: 30 }]);
  });

  it("sums all quantities", () => {
    expect(totalSold(sales)).toBe(35);
  });
});

describe("consumptionByItem / topConsumedItems", () => {
  const consumption: ConsumptionRow[] = [
    { quantity_base: -110, event_date: "2026-08-01", caravan_name: "Karavan 1", item_name: "Barbekü" },
    { quantity_base: -50, event_date: "2026-08-01", caravan_name: "Karavan 1", item_name: "Ketçap" },
    { quantity_base: -220, event_date: "2026-08-02", caravan_name: "Karavan 2", item_name: "Barbekü" },
  ];

  it("uses absolute consumption values", () => {
    expect(consumptionByItem(consumption)).toEqual([
      { key: "Barbekü", total: 330 },
      { key: "Ketçap", total: 50 },
    ]);
  });

  it("limits top consumed items", () => {
    expect(topConsumedItems(consumption, 1)).toEqual([{ key: "Barbekü", total: 330 }]);
  });
});

describe("wasteByType", () => {
  it("sums waste quantities by type", () => {
    const waste: WasteRow[] = [
      { event_date: "2026-08-01", caravan_name: "Karavan 1", item_name: "Sosis", waste_type: "fire", quantity_base: 3 },
      { event_date: "2026-08-01", caravan_name: "Karavan 1", item_name: "Su", waste_type: "complimentary", quantity_base: 2 },
      { event_date: "2026-08-02", caravan_name: "Karavan 2", item_name: "Sosis", waste_type: "fire", quantity_base: 1 },
    ];
    expect(wasteByType(waste)).toEqual([
      { key: "fire", total: 4 },
      { key: "complimentary", total: 2 },
    ]);
  });
});

describe("significantVariances", () => {
  it("filters out zero variance and sorts by absolute size", () => {
    const variances: VarianceRow[] = [
      { event_date: "2026-08-01", event_name: "A", caravan_name: "Karavan 1", item_name: "Sosis", variance_qty: 0, variance_pct: 0 },
      { event_date: "2026-08-01", event_name: "A", caravan_name: "Karavan 1", item_name: "Ketçap", variance_qty: -2, variance_pct: -20 },
      { event_date: "2026-08-01", event_name: "A", caravan_name: "Karavan 1", item_name: "Barbekü", variance_qty: 5, variance_pct: 10 },
    ];
    expect(significantVariances(variances).map((v) => v.item_name)).toEqual(["Barbekü", "Ketçap"]);
  });
});

describe("caravanComparison", () => {
  it("combines sold and consumed totals per caravan", () => {
    const consumption: ConsumptionRow[] = [
      { quantity_base: -100, event_date: "2026-08-01", caravan_name: "Karavan 1", item_name: "Barbekü" },
    ];
    const result = caravanComparison(sales, consumption);
    expect(result.find((r) => r.caravan === "Karavan 1")).toEqual({
      caravan: "Karavan 1",
      sold: 15,
      consumed: 100,
    });
    expect(result.find((r) => r.caravan === "Karavan 2")).toEqual({
      caravan: "Karavan 2",
      sold: 20,
      consumed: 0,
    });
  });
});
