import type { Database } from "@/types/database";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

/** Birim dönüşümü için bir stok kaleminden gereken alanlar. */
export type UnitItem = Pick<
  InventoryItem,
  "unit_type" | "portion_kg_factor" | "unit_label" | "pack_size"
>;

export type DisplayUnitChoice = "base" | "kg" | "pack";

export type UnitOption = { value: DisplayUnitChoice; label: string };

function hasPack(item: UnitItem): item is UnitItem & { unit_label: string; pack_size: number } {
  return item.unit_type === "weight" && Boolean(item.unit_label) && Boolean(item.pack_size);
}

/** Kalemin ana biriminin görünen adı: sayma kalemlerinde birim etiketi (koli, paket...). */
export function baseUnitLabel(item: UnitItem): string {
  if (item.unit_type === "count") return item.unit_label || "adet";
  if (item.unit_type === "weight") return "gram";
  return "porsiyon";
}

/** Giriş formlarında seçilebilecek birimler (ilki ana birimdir). */
export function unitOptions(item: UnitItem): UnitOption[] {
  const options: UnitOption[] = [{ value: "base", label: baseUnitLabel(item) }];
  if (item.unit_type === "weight") options.push({ value: "kg", label: "kg" });
  if (item.unit_type === "portion" && item.portion_kg_factor) {
    options.push({ value: "kg", label: "kg" });
  }
  if (hasPack(item)) options.push({ value: "pack", label: item.unit_label });
  return options;
}

/** Formlarda varsayılan giriş birimi: paket > kg > ana birim. */
export function defaultUnitChoice(item: UnitItem): DisplayUnitChoice {
  const options = unitOptions(item);
  if (options.some((o) => o.value === "pack")) return "pack";
  if (options.some((o) => o.value === "kg")) return "kg";
  return "base";
}

/**
 * Kullanıcının seçtiği giriş birimindeki değeri ana birime çevirir.
 * - Sayma kalemleri: her zaman ana birim (etiket yalnızca görünümdür).
 * - Gram kalemleri: "kg" ×1000, "pack" ×pack_size (1 teneke = pack_size gram).
 * - Porsiyon kalemleri (Patates): "kg" ×portion_kg_factor.
 */
export function toBaseUnit(
  value: number,
  item: UnitItem,
  choice: DisplayUnitChoice,
): number {
  if (choice === "pack" && hasPack(item)) return value * item.pack_size;
  if (choice === "kg") {
    if (item.unit_type === "weight") return value * 1000;
    if (item.unit_type === "portion" && item.portion_kg_factor) {
      return value * item.portion_kg_factor;
    }
  }
  return value;
}

/** toBaseUnit'in tersi: ana birimdeki değeri seçilen giriş birimine çevirir. */
export function fromBaseUnit(
  valueBase: number,
  item: UnitItem,
  choice: DisplayUnitChoice,
): number {
  if (choice === "pack" && hasPack(item)) return valueBase / item.pack_size;
  if (choice === "kg") {
    if (item.unit_type === "weight") return valueBase / 1000;
    if (item.unit_type === "portion" && item.portion_kg_factor) {
      return valueBase / item.portion_kg_factor;
    }
  }
  return valueBase;
}

function fmt(value: number, maxFractionDigits = 2): string {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: maxFractionDigits });
}

/**
 * Ana birimdeki bir değeri kullanıcıya anlaşılır tek bir metin olarak gösterir:
 * "12 koli", "2,5 kg", "2 teneke (6 kg)", "2 kg (10 porsiyon)".
 */
export function formatQuantity(item: UnitItem, quantityBase: number): string {
  if (item.unit_type === "weight") {
    const kgText = `${fmt(quantityBase / 1000)} kg`;
    if (hasPack(item)) {
      return `${fmt(quantityBase / item.pack_size)} ${item.unit_label} (${kgText})`;
    }
    return kgText;
  }
  if (item.unit_type === "portion") {
    const portionText = `${fmt(quantityBase)} porsiyon`;
    return item.portion_kg_factor
      ? `${fmt(quantityBase / item.portion_kg_factor)} kg (${portionText})`
      : portionText;
  }
  return `${fmt(quantityBase)} ${baseUnitLabel(item)}`;
}
