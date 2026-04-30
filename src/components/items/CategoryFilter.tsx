import { CATEGORY_CONFIG, ITEM_CATEGORIES } from "@/lib/items/categories";
import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/types/supabase";
import { LayoutGrid } from "lucide-react";
import Link from "next/link";

interface CategoryFilterProps {
  basePath: string;
  active: ItemCategory | null;
  counts?: Partial<Record<ItemCategory | "all", number>>;
}

export function CategoryFilter({ basePath, active, counts }: CategoryFilterProps) {
  return (
    <nav
      className="-mx-2 flex flex-wrap items-center gap-2 overflow-x-auto px-2 pb-1"
      aria-label="Kategorien filtern"
    >
      <FilterPill
        href={basePath}
        isActive={active === null}
        icon={<LayoutGrid size={13} strokeWidth={1.75} aria-hidden />}
        label="Alle"
        count={counts?.all}
      />
      {ITEM_CATEGORIES.map((category) => {
        const Icon = CATEGORY_CONFIG[category].icon;
        return (
          <FilterPill
            key={category}
            href={`${basePath}?category=${category}`}
            isActive={active === category}
            icon={<Icon size={13} strokeWidth={1.75} aria-hidden />}
            label={CATEGORY_CONFIG[category].label}
            count={counts?.[category]}
          />
        );
      })}
    </nav>
  );
}

interface FilterPillProps {
  href: string;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

function FilterPill({ href, isActive, icon, label, count }: FilterPillProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors",
        isActive
          ? "border-petrol-500 bg-petrol-950/60 text-petrol-200"
          : "border-cockpit-border text-cockpit-muted hover:border-petrol-700 hover:text-cockpit-text"
      )}
    >
      {icon}
      <span>{label}</span>
      {typeof count === "number" && (
        <span className="text-[10px] text-cockpit-muted">{count}</span>
      )}
    </Link>
  );
}
