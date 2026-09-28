import { describe, expect, it } from "vitest";
import { toBaseUnit, fromBaseUnit, supportsKgToggle, baseUnitLabel, formatQuantity } from "@/lib/units";

describe("toBaseUnit", () => {
  it("passes count items through unchanged", () => {
    expect(toBaseUnit(5, "count", "base", null)).toBe(5);
    expect(toBaseUnit(5, "count", "kg", null)).toBe(5);
  });

  it("converts weight kg input to grams (x1000)", () => {
    expect(toBaseUnit(1.5, "weight", "kg", null)).toBe(1500);
    expect(toBaseUnit(250, "weight", "base", null)).toBe(250);
  });

  it("converts portion kg input using the item's configurable factor", () => {
    expect(toBaseUnit(2, "portion", "kg", 5)).toBe(10);
    expect(toBaseUnit(3, "portion", "base", 5)).toBe(3);
  });
});

describe("fromBaseUnit", () => {
  it("is the inverse of toBaseUnit for weight and portion items", () => {
    expect(fromBaseUnit(1500, "weight", "kg", null)).toBe(1.5);
    expect(fromBaseUnit(10, "portion", "kg", 5)).toBe(2);
    expect(fromBaseUnit(3, "count", "kg", null)).toBe(3);
  });
});

describe("supportsKgToggle / baseUnitLabel", () => {
  it("only weight and portion items support the kg toggle", () => {
    expect(supportsKgToggle("count")).toBe(false);
    expect(supportsKgToggle("weight")).toBe(true);
    expect(supportsKgToggle("portion")).toBe(true);
  });

  it("labels base units correctly", () => {
    expect(baseUnitLabel("count")).toBe("adet");
    expect(baseUnitLabel("weight")).toBe("gram");
    expect(baseUnitLabel("portion")).toBe("porsiyon");
  });
});

describe("formatQuantity", () => {
  it("formats count items as adet", () => {
    expect(formatQuantity("count", 12, null)).toBe("12 adet");
  });

  it("formats weight items in kg", () => {
    expect(formatQuantity("weight", 2500, null)).toBe("2,5 kg");
  });

  it("formats portion items in kg with portion count", () => {
    expect(formatQuantity("portion", 10, 5)).toBe("2 kg (10 porsiyon)");
  });

  it("falls back to portion-only text when no kg factor is set", () => {
    expect(formatQuantity("portion", 10, null)).toBe("10 porsiyon");
  });
});
