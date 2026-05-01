"use client";

import { useState, useTransition } from "react";
import { fetchExploreFeed } from "@/lib/explore/actions";
import { EXPLORE_PAGE_SIZE, type ExploreItem } from "@/lib/explore/types";
import { ExploreItemCard } from "./ExploreItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ItemCategory } from "@/types/supabase";
import { Compass, Loader2, Plus, UserPlus } from "lucide-react";
import Link from "next/link";

interface ExploreFeedProps {
  initialItems: ExploreItem[];
  category?: ItemCategory;
}

export function ExploreFeed({ initialItems, category }: ExploreFeedProps) {
  const [items, setItems] = useState<ExploreItem[]>(initialItems);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(
    initialItems.length === EXPLORE_PAGE_SIZE
  );
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const nextPage = page + 1;
      const newItems = await fetchExploreFeed(nextPage, category);
      setItems((prev) => [...prev, ...newItems]);
      setPage(nextPage);
      if (newItems.length < EXPLORE_PAGE_SIZE) {
        setHasMore(false);
      }
    });
  }

  if (items.length === 0) {
    return <ExploreEmptyState filtered={!!category} />;
  }

  return (
    <section aria-label="Community-Setups">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ExploreItemCard key={item.id} item={item} />
        ))}
        {isPending &&
          Array.from({ length: 3 }).map((_, i) => (
            <ExploreItemCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isPending}
            className="gap-2 border-cockpit-border text-cockpit-muted hover:border-petrol-600 hover:text-petrol-300"
          >
            {isPending ? (
              <Loader2 size={14} strokeWidth={1.75} aria-hidden className="animate-spin" />
            ) : (
              <Plus size={14} strokeWidth={1.75} aria-hidden />
            )}
            {isPending ? "Laden …" : "Mehr laden"}
          </Button>
        </div>
      )}
    </section>
  );
}

function ExploreItemCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-cockpit-border bg-cockpit-surface">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-2.5 w-1/3" />
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="mt-auto flex items-center gap-2 border-t border-cockpit-border pt-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      </div>
    </div>
  );
}

interface ExploreEmptyStateProps {
  filtered: boolean;
}

function ExploreEmptyState({ filtered }: ExploreEmptyStateProps) {
  return (
    <div
      role="status"
      className="rounded-lg border border-dashed border-petrol-800/60 bg-cockpit-surface/60 p-10 text-center"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-petrol-700/50 bg-petrol-950/40 text-petrol-300">
        <Compass size={26} strokeWidth={1.5} aria-hidden />
      </div>
      <p className="text-[11px] uppercase tracking-widest text-petrol-300">
        {filtered ? "Keine Treffer" : "Noch leer"}
      </p>
      <h2 className="mt-1 text-base font-semibold text-cockpit-text">
        {filtered
          ? "Keine Items in dieser Kategorie."
          : "Noch keine öffentlichen Setups."}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-cockpit-muted">
        {filtered
          ? "Wechsle die Kategorie oder entdecke alle öffentlichen Setups."
          : "Sei der Erste — registriere dein Setup und teile es mit der Community."}
      </p>
      {!filtered && (
        <Link
          href="/login"
          className="mt-5 inline-flex items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-3.5 py-2 text-sm font-medium text-white shadow-cockpit transition-colors hover:bg-petrol-500"
        >
          <UserPlus size={16} strokeWidth={2} aria-hidden />
          Registrieren & Setup teilen
        </Link>
      )}
    </div>
  );
}
