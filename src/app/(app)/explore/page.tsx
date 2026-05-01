import { CategoryFilter } from "@/components/items/CategoryFilter";
import { ExploreFeed } from "@/components/explore/ExploreFeed";
import { fetchExploreFeed } from "@/lib/explore/actions";
import { isItemCategory } from "@/lib/items/categories";
import type { ItemCategory } from "@/types/supabase";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entdecken · Setup Registry",
};

interface ExplorePageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const category: ItemCategory | undefined = isItemCategory(params.category)
    ? params.category
    : undefined;

  const initialItems = await fetchExploreFeed(0, category);

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[11px] tracking-widest text-petrol-400">
          Community
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Entdecken <span className="text-petrol-400">·</span>
        </h1>
        <p className="mt-1 text-sm text-cockpit-muted">
          Öffentliche Setups der Community
        </p>
      </header>

      <CategoryFilter basePath="/explore" active={category ?? null} />

      <ExploreFeed
        key={category ?? "all"}
        initialItems={initialItems}
        category={category}
      />
    </div>
  );
}
