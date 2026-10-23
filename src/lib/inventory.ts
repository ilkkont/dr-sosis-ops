import type { Database } from "@/types/database";

export type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
export type InventoryCategory = Database["public"]["Tables"]["inventory_categories"]["Row"];

type CategoryRef = { name: string; sort_order: number } | null;

export type ItemWithCategory = InventoryItem & { inventory_categories: CategoryRef };

/** Kalem listelerinde kategori adı/sırası için kullanılan ortak select. */
export const ITEM_WITH_CATEGORY_SELECT = "*, inventory_categories(name, sort_order)";

type Categorized = { name: string; inventory_categories: CategoryRef };

export function categoryName(item: Categorized): string {
  return item.inventory_categories?.name ?? "Diğer";
}

/** Kategori sırasına (sort_order), sonra Türkçe alfabetik ada göre sıralar. */
export function sortItemsByCategory<T extends Categorized>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const orderA = a.inventory_categories?.sort_order ?? 9999;
    const orderB = b.inventory_categories?.sort_order ?? 9999;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, "tr");
  });
}

/** Sıralı listede bu satır yeni bir kategori grubunu mu başlatıyor? */
export function startsNewCategory<T extends Categorized>(items: T[], index: number): boolean {
  return index === 0 || categoryName(items[index - 1]) !== categoryName(items[index]);
}
