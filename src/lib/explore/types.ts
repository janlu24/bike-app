import type { ItemCategory } from "@/types/supabase";

export const EXPLORE_PAGE_SIZE = 24;

export type ExploreItem = {
  id: string;
  category: ItemCategory;
  brand: string;
  model: string | null;
  image_url: string | null;
  weight_g: number | null;
  owner: { username: string; avatar_url: string | null };
};

type RawOwner = { username: string; avatar_url: string | null };

export type RawRow = {
  id: string;
  category: ItemCategory;
  brand: string;
  model: string | null;
  image_url: string | null;
  weight_g: number | null;
  profiles: RawOwner | RawOwner[] | null;
};

export function mapRawRowToExploreItem(row: RawRow): ExploreItem {
  const owner = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    category: row.category,
    brand: row.brand,
    model: row.model,
    image_url: row.image_url,
    weight_g: row.weight_g,
    owner: {
      username: owner?.username ?? "",
      avatar_url: owner?.avatar_url ?? null,
    },
  };
}
