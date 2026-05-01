import { CATEGORY_CONFIG } from "@/lib/items/categories";
import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/types/supabase";
import Link from "next/link";

interface CategoryTileProps {
  category: ItemCategory;
  count: number;
}

export function CategoryTile({ category, count }: CategoryTileProps) {
  const { label, icon: Icon, emptyHint } = CATEGORY_CONFIG[category];

  return (
    <Link
      href={`/garage?category=${category}`}
      aria-label={`${label} – ${count} Item${count === 1 ? "" : "s"}`}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border border-cockpit-border bg-cockpit-surface p-4",
        "transition-colors hover:border-petrol-700 hover:bg-cockpit-surface/80"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          size={16}
          strokeWidth={1.75}
          aria-hidden
          className="text-petrol-400"
        />
        <span className="text-[11px] font-medium uppercase tracking-widest text-cockpit-muted">
          {label}
        </span>
      </div>

      <span
        aria-hidden
        className="font-mono text-4xl font-semibold tabular-nums text-cockpit-text group-hover:text-petrol-300"
      >
        {count}
      </span>

      <span className="text-xs text-cockpit-muted">
        {count === 0 ? emptyHint : `${count} angelegt`}
      </span>
    </Link>
  );
}
