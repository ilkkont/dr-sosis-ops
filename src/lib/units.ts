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

/** toBaseUnit'in tersi: ana birimdeki bir değeri seçilen giriş birimine çevirir. */
export function fromBaseUnit(
  valueBase: number,
  unitType: UnitType,
  displayChoice: DisplayUnitChoice,
  portionKgFactor: number | null,
): number {
  if (displayChoice === "kg") {
    if (unitType === "weight") return valueBase / 1000;
    if (unitType === "portion" && portionKgFactor) return valueBase / portionKgFactor;
  }
  return valueBase;
}

export function baseUnitLabel(unitType: UnitType): string {
  if (unitType === "count") return "adet";
  if (unitType === "weight") return "gram";
  return "porsiyon";
}

export function supportsKgToggle(unitType: UnitType): boolean {
  return unitType === "weight" || unitType === "portion";
}

/**
 * Ana birimdeki (gram/porsiyon/adet) bir değeri kullanıcıya kg/adet gibi
 * anlaşılır bir birimde, tek bir metin olarak gösterir. Gram kalemler kg'a
 * çevrilir; porsiyon kalemler hem kg hem porsiyon karşılığını gösterir;
 * adet kalemler doğrudan adet olarak gösterilir.
 */
export function formatQuantity(
  unitType: UnitType,
  quantityBase: number,
  portionKgFactor: number | null,
): string {
  if (unitType === "weight") {
    return `${(quantityBase / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} kg`;
  }
  if (unitType === "portion") {
    const kg = portionKgFactor ? quantityBase / portionKgFactor : null;
    const portionText = `${quantityBase.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} porsiyon`;
    return kg !== null
      ? `${kg.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} kg (${portionText})`
      : portionText;
  }
  return `${quantityBase.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} adet`;
}
