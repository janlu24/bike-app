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

  // Collect all descendants recursively for accurate weight sum
  const allDescendants = collectDescendants(bike.id, allItems);
  const contributors: ItemRow[] = [bike, ...allDescendants];

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

function collectDescendants(
  parentId: string,
  allItems: readonly ItemRow[],
  visited: Set<string> = new Set()
): ItemRow[] {
  if (visited.has(parentId)) return [];
  visited.add(parentId);
  const children = allItems.filter((i) => i.parent_id === parentId && i.id !== parentId);
  return children.flatMap((child) => [child, ...collectDescendants(child.id, allItems, visited)]);
}
