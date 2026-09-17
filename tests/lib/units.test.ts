import { describe, expect, it } from "vitest";
import { toBaseUnit, supportsKgToggle, baseUnitLabel } from "@/lib/units";

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
