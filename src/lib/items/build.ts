import type { ItemRow } from "@/types/supabase";

export interface BuildSummary {
  bike: ItemRow;
  parts: ItemRow[];
  totalWeight: number;
  partCount: number;
  hasUnknownWeight: boolean;
}

export function computeBuild(
  bike: ItemRow,
  allItems: readonly ItemRow[]
): BuildSummary {
  const parts = allItems.filter(
    (i) => i.parent_id === bike.id && i.id !== bike.id
  );

  const contributors: ItemRow[] = [bike, ...parts];
  let totalWeight = 0;
  let hasUnknownWeight = false;
  for (const item of contributors) {
    if (item.weight_g === null || item.weight_g === undefined) {
      hasUnknownWeight = true;
      continue;
    }
    totalWeight += item.weight_g;
  }

  return { bike, parts, totalWeight, partCount: parts.length, hasUnknownWeight };
}
