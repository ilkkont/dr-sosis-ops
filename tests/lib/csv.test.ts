import { describe, expect, it } from "vitest";
import { toCSV } from "@/lib/csv";

describe("toCSV", () => {
  it("builds a header row and escapes fields containing separators", () => {
    const csv = toCSV(
      [
        { name: "Klasik Frankfurter", qty: 10 },
        { name: 'İkram; "özel"', qty: 2 },
      ],
      [
        { key: "name", label: "Ürün" },
        { key: "qty", label: "Adet" },
      ],
    );

    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Ürün;Adet");
    expect(lines[1]).toBe("Klasik Frankfurter;10");
    expect(lines[2]).toBe('"İkram; ""özel""";2');
  });
});
