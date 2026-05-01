"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
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

type RawRow = {
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

export async function fetchExploreFeed(
  page: number,
  category?: ItemCategory
): Promise<ExploreItem[]> {
  const supabase = await createSupabaseServerClient();

  const from = page * EXPLORE_PAGE_SIZE;
  const to = from + EXPLORE_PAGE_SIZE - 1;

  let query = supabase
    .from("items")
    .select(
      "id, category, brand, model, image_url, weight_g, profiles!inner(username, avatar_url)"
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[explore] fetchExploreFeed error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapRawRowToExploreItem(row as unknown as RawRow));
}
