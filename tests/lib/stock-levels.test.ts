import { describe, expect, it } from "vitest";
import { stockLevelsMatrix } from "@/lib/reports";

describe("stockLevelsMatrix", () => {
  const depot = [
    { inventory_item_id: "a", balance: 10 },
    { inventory_item_id: "b", balance: 0 },
  ];
  const caravans = [
    { caravan_id: "k1", inventory_item_id: "a", balance: 4 },
    { caravan_id: "k2", inventory_item_id: "a", balance: 1 },
    { caravan_id: "k1", inventory_item_id: "c", balance: 7 },
  ];

  it("combines depot and caravan balances per item and keeps the given order", () => {
    const rows = stockLevelsMatrix(["c", "a", "b"], depot, caravans, false);
    expect(rows.map((r) => r.itemId)).toEqual(["c", "a", "b"]);
    expect(rows[1]).toEqual({ itemId: "a", depot: 10, caravans: { k1: 4, k2: 1 }, total: 15 });
    expect(rows[0]).toEqual({ itemId: "c", depot: 0, caravans: { k1: 7 }, total: 7 });
  });

  it("drops rows that are zero everywhere when hideZero is set", () => {
    const rows = stockLevelsMatrix(["a", "b", "c", "d"], depot, caravans, true);
    expect(rows.map((r) => r.itemId)).toEqual(["a", "c"]);
  });
});
