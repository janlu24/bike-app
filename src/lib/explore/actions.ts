"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  EXPLORE_PAGE_SIZE,
  mapRawRowToExploreItem,
  type ExploreItem,
  type RawRow,
} from "@/lib/explore/types";
import type { ItemCategory } from "@/types/supabase";

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

  return (data ?? []).map((row) =>
    mapRawRowToExploreItem(row as unknown as RawRow)
  );
}
