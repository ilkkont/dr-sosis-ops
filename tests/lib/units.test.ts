import { describe, expect, it } from "vitest";
import {
  baseUnitLabel,
  defaultUnitChoice,
  formatQuantity,
  fromBaseUnit,
  toBaseUnit,
  unitOptions,
  type UnitItem,
} from "@/lib/units";

const count: UnitItem = { unit_type: "count", portion_kg_factor: null, unit_label: null, pack_size: null };
const koli: UnitItem = { unit_type: "count", portion_kg_factor: null, unit_label: "koli", pack_size: null };
const weight: UnitItem = { unit_type: "weight", portion_kg_factor: null, unit_label: null, pack_size: null };
const teneke: UnitItem = { unit_type: "weight", portion_kg_factor: null, unit_label: "teneke", pack_size: 3000 };
const tenekeNoSize: UnitItem = { unit_type: "weight", portion_kg_factor: null, unit_label: "teneke", pack_size: null };
const portion: UnitItem = { unit_type: "portion", portion_kg_factor: 5, unit_label: null, pack_size: null };

describe("toBaseUnit", () => {
  it("passes count items through unchanged", () => {
    expect(toBaseUnit(5, count, "base")).toBe(5);
    expect(toBaseUnit(5, koli, "kg")).toBe(5);
  });

  it("converts weight kg input to grams (x1000)", () => {
    expect(toBaseUnit(1.5, weight, "kg")).toBe(1500);
    expect(toBaseUnit(250, weight, "base")).toBe(250);
  });

  it("converts pack input using pack_size, ignoring pack when no size is set", () => {
    expect(toBaseUnit(2, teneke, "pack")).toBe(6000);
    expect(toBaseUnit(2, tenekeNoSize, "pack")).toBe(2);
  });

  it("converts portion kg input using the item's configurable factor", () => {
    expect(toBaseUnit(2, portion, "kg")).toBe(10);
    expect(toBaseUnit(3, portion, "base")).toBe(3);
  });
});

describe("fromBaseUnit", () => {
  it("is the inverse of toBaseUnit", () => {
    expect(fromBaseUnit(1500, weight, "kg")).toBe(1.5);
    expect(fromBaseUnit(6000, teneke, "pack")).toBe(2);
    expect(fromBaseUnit(10, portion, "kg")).toBe(2);
    expect(fromBaseUnit(3, count, "kg")).toBe(3);
  });
});

describe("unitOptions / defaultUnitChoice / baseUnitLabel", () => {
  it("offers only the item's own unit for count items", () => {
    expect(unitOptions(count)).toEqual([{ value: "base", label: "adet" }]);
    expect(unitOptions(koli)).toEqual([{ value: "base", label: "koli" }]);
  });

  it("offers gram/kg for weight items and adds the pack unit when a size is set", () => {
    expect(unitOptions(weight).map((o) => o.value)).toEqual(["base", "kg"]);
    expect(unitOptions(teneke).map((o) => o.label)).toEqual(["gram", "kg", "teneke"]);
    expect(unitOptions(tenekeNoSize).map((o) => o.value)).toEqual(["base", "kg"]);
  });

  it("picks pack, then kg, then base as the default entry unit", () => {
    expect(defaultUnitChoice(teneke)).toBe("pack");
    expect(defaultUnitChoice(weight)).toBe("kg");
    expect(defaultUnitChoice(portion)).toBe("kg");
    expect(defaultUnitChoice(koli)).toBe("base");
  });

  it("labels base units correctly", () => {
    expect(baseUnitLabel(count)).toBe("adet");
    expect(baseUnitLabel(koli)).toBe("koli");
    expect(baseUnitLabel(weight)).toBe("gram");
    expect(baseUnitLabel(portion)).toBe("porsiyon");
  });
});

describe("formatQuantity", () => {
  it("formats count items with their label", () => {
    expect(formatQuantity(count, 12)).toBe("12 adet");
    expect(formatQuantity(koli, 3)).toBe("3 koli");
  });

  it("keeps decimals for litre-style count items", () => {
    expect(formatQuantity({ ...count, unit_label: "litre" }, 2.5)).toBe("2,5 litre");
  });

  it("formats weight items in kg, with the pack count when a size is set", () => {
    expect(formatQuantity(weight, 2500)).toBe("2,5 kg");
    expect(formatQuantity(teneke, 6000)).toBe("2 teneke (6 kg)");
    expect(formatQuantity(tenekeNoSize, 6000)).toBe("6 kg");
  });

  it("formats portion items in kg with portion count", () => {
    expect(formatQuantity(portion, 10)).toBe("2 kg (10 porsiyon)");
    expect(formatQuantity({ ...portion, portion_kg_factor: null }, 10)).toBe("10 porsiyon");
  });
});
