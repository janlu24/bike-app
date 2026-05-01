import type { ItemCategory } from "@/types/supabase";
import { ITEM_CATEGORIES } from "./categories";

export interface CategoryCounts {
  total: number;
  byCategory: Record<ItemCategory, number>;
}

export function aggregateCounts(
  items: readonly { category: ItemCategory }[]
): CategoryCounts {
  const byCategory = Object.fromEntries(
    ITEM_CATEGORIES.map((c) => [c, 0])
  ) as Record<ItemCategory, number>;

  for (const item of items) {
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
  }

  return { total: items.length, byCategory };
}
