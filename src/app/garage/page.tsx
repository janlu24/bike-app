import { BikeSelector } from "@/components/items/BikeSelector";
import { BuildView } from "@/components/items/BuildView";
import { CategoryFilter } from "@/components/items/CategoryFilter";
import { EmptyState } from "@/components/items/EmptyState";
import { ItemCard } from "@/components/items/ItemCard";
import { computeBuild } from "@/lib/items/build";
import { CATEGORY_CONFIG, ITEM_CATEGORIES, isItemCategory } from "@/lib/items/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BikeOption, ItemCategory, ItemRow } from "@/types/supabase";
import { Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface GaragePageProps {
  searchParams: Promise<{ category?: string; bikeId?: string }>;
}

export default async function GaragePage({ searchParams }: GaragePageProps) {
  const { category, bikeId } = await searchParams;
  const activeCategory: ItemCategory | null = isItemCategory(category) ? category : null;
  const requestedBikeId =
    typeof bikeId === "string" && bikeId.length > 0 ? bikeId : null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rawItems } = user
    ? await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] as ItemRow[] };

  const items = (rawItems ?? []) as ItemRow[];

  const bikeOptions: BikeOption[] = items
    .filter((i) => i.category === "Bike")
    .map((b) => ({ id: b.id, brand: b.brand, model: b.model }));

  const activeBike =
    requestedBikeId !== null
      ? (items.find((i) => i.id === requestedBikeId && i.category === "Bike") ?? null)
      : null;
  const buildMode = activeBike !== null;

  const counts: Partial<Record<ItemCategory | "all", number>> = { all: items.length };
  for (const cat of ITEM_CATEGORIES) {
    counts[cat] = items.filter((i) => i.category === cat).length;
  }

  const visibleItems = activeCategory
    ? items.filter((i) => i.category === activeCategory)
    : items;

  const parents = buildParentLookup(items);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
            Library
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Deine <span className="text-petrol-400">Garage</span>
          </h1>
          <p className="mt-1 text-sm text-cockpit-muted">
            {buildMode
              ? `Build-Fokus · ${activeBike!.brand}${activeBike!.model ? ` ${activeBike!.model}` : ""}`
              : `${items.length} Item${items.length === 1 ? "" : "s"} insgesamt${
                  activeCategory
                    ? ` · gefiltert nach ${CATEGORY_CONFIG[activeCategory].label}`
                    : ""
                }`}
          </p>
        </div>

        <Link
          href="/garage/new"
          className="inline-flex items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-3.5 py-2 text-sm font-medium text-white shadow-cockpit transition-colors hover:bg-petrol-500"
        >
          <Plus size={16} strokeWidth={2} aria-hidden />
          Neues Item
        </Link>
      </header>

      <BikeSelector bikes={bikeOptions} activeBikeId={buildMode ? activeBike!.id : null} />

      {buildMode ? (
        <BuildView build={computeBuild(activeBike!, items)} />
      ) : (
        <>
          <CategoryFilter basePath="/garage" active={activeCategory} counts={counts} />

          {visibleItems.length === 0 ? (
            <EmptyState
              filtered={activeCategory !== null}
              hint={activeCategory ? CATEGORY_CONFIG[activeCategory].emptyHint : undefined}
            />
          ) : activeCategory ? (
            <CategoryGrid items={visibleItems} parents={parents} />
          ) : (
            <GroupedByCategory items={visibleItems} parents={parents} />
          )}
        </>
      )}
    </div>
  );
}

type ParentLookup = Record<string, { id: string; brand: string; model: string | null }>;

function buildParentLookup(items: ItemRow[]): ParentLookup {
  const lookup: ParentLookup = {};
  for (const i of items) {
    if (i.category === "Bike") {
      lookup[i.id] = { id: i.id, brand: i.brand, model: i.model };
    }
  }
  return lookup;
}

function CategoryGrid({
  items,
  parents,
}: {
  items: ItemRow[];
  parents: ParentLookup;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          parent={item.parent_id ? parents[item.parent_id] : null}
        />
      ))}
    </div>
  );
}

function GroupedByCategory({
  items,
  parents,
}: {
  items: ItemRow[];
  parents: ParentLookup;
}) {
  return (
    <div className="space-y-8">
      {ITEM_CATEGORIES.map((category) => {
        const group = items.filter((i) => i.category === category);
        if (group.length === 0) return null;
        const config = CATEGORY_CONFIG[category];
        const Icon = config.icon;
        const sorted = [...group].sort((a, b) => {
          if (!!a.parent_id === !!b.parent_id) return 0;
          return a.parent_id ? -1 : 1;
        });
        return (
          <section key={category} className="space-y-3">
            <header className="flex items-center gap-2">
              <Icon size={14} strokeWidth={1.75} className="text-petrol-400" aria-hidden />
              <h2 className="text-[11px] uppercase tracking-widest text-cockpit-muted">
                {config.label}
              </h2>
              <span className="text-[11px] text-cockpit-muted">· {group.length}</span>
            </header>
            <CategoryGrid items={sorted} parents={parents} />
          </section>
        );
      })}
    </div>
  );
}
