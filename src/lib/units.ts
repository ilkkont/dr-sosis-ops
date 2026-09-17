import type { Database } from "@/types/database";

type UnitType = Database["public"]["Enums"]["unit_type"];

export type DisplayUnitChoice = "base" | "kg";

/**
 * Kullanıcının seçtiği giriş birimindeki değeri ana birime çevirir.
 * - Adet kalemler: her zaman ana birim (dönüşüm yok).
 * - Gram kalemler: "kg" seçilirse ×1000 (sabit, evrensel dönüşüm).
 * - Porsiyon kalemler (örn. Patates): "kg" seçilirse ×portion_kg_factor
 *   (yönetilebilir katsayı, panelden değiştirilebilir).
 */
export function toBaseUnit(
  value: number,
  unitType: UnitType,
  displayChoice: DisplayUnitChoice,
  portionKgFactor: number | null,
): number {
  if (displayChoice === "kg") {
    if (unitType === "weight") return value * 1000;
    if (unitType === "portion" && portionKgFactor) return value * portionKgFactor;
  }
  return value;
}

export function baseUnitLabel(unitType: UnitType): string {
  if (unitType === "count") return "adet";
  if (unitType === "weight") return "gram";
  return "porsiyon";
}

export function supportsKgToggle(unitType: UnitType): boolean {
  return unitType === "weight" || unitType === "portion";
}
