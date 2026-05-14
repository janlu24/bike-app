"use client";

import { useState, useEffect, useMemo } from "react";
import { CATEGORY_CONFIG, ITEM_CATEGORIES } from "@/lib/items/categories";
import type { ItemCategory, ItemRow } from "@/types/supabase";
import { ItemCard } from "./ItemCard";
import { InventoryListRow } from "./InventoryListRow";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";
import { LayoutGrid, List } from "lucide-react";

const STORAGE_KEY = "inventory_view";

type ViewMode = "grid" | "list";

interface ParentInfo {
  id: string;
  brand: string;
  model: string | null;
}

interface InventoryClientProps {
  items: ItemRow[];
  parentLookup: Record<string, ParentInfo>;
}

export function InventoryClient({ items, parentLookup }: InventoryClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ItemCategory | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "list" || stored === "grid") setViewMode(stored);
    } catch {
      // localStorage unavailable — keep default
    }
  }, []);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const counts = useMemo(() => {
    const result: Partial<Record<ItemCategory | "all", number>> = { all: items.length };
    for (const cat of ITEM_CATEGORIES) {
      result[cat] = items.filter((i) => i.category === cat).length;
    }
    return result;
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return items.filter((item) => {
      const matchesCategory = activeCategory === null || item.category === activeCategory;
      const matchesSearch =
        q === "" ||
        item.brand.toLowerCase().includes(q) ||
        (item.model?.toLowerCase().includes(q) ?? false);
      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategory, debouncedQuery]);

  const isFiltered = debouncedQuery !== "" || activeCategory !== null;
  const subtitle = isFiltered
    ? `${filteredItems.length} von ${items.length} Items`
    : `${items.length} Item${items.length === 1 ? "" : "s"} insgesamt`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="search"
            placeholder="Suche nach Marke oder Modell …"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Items suchen"
            className="w-full rounded-md border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text placeholder:text-cockpit-muted/60 focus:border-petrol-600 focus:outline-none focus:ring-1 focus:ring-petrol-600"
          />
        </div>

        <div
          className="flex items-center gap-0.5 rounded-md border border-cockpit-border bg-cockpit-surface p-0.5"
          role="group"
          aria-label="Ansicht wechseln"
        >
          <button
            type="button"
            onClick={() => handleViewChange("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label="Kachelansicht"
            className={cn(
              "flex items-center justify-center rounded p-1.5 transition-colors",
              viewMode === "grid"
                ? "bg-petrol-700/60 text-petrol-200"
                : "text-cockpit-muted hover:text-cockpit-text"
            )}
          >
            <LayoutGrid size={15} strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => handleViewChange("list")}
            aria-pressed={viewMode === "list"}
            aria-label="Listenansicht"
            className={cn(
              "flex items-center justify-center rounded p-1.5 transition-colors",
              viewMode === "list"
                ? "bg-petrol-700/60 text-petrol-200"
                : "text-cockpit-muted hover:text-cockpit-text"
            )}
          >
            <List size={15} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>

      {/* Category filter */}
      <nav
        className="-mx-2 flex flex-wrap items-center gap-2 overflow-x-auto px-2 pb-1"
        aria-label="Kategorien filtern"
      >
        <CategoryPill
          label="Alle"
          isActive={activeCategory === null}
          count={counts.all}
          onClick={() => setActiveCategory(null)}
        />
        {ITEM_CATEGORIES.map((cat) => {
          const CatIcon = CATEGORY_CONFIG[cat].icon;
          return (
            <CategoryPill
              key={cat}
              label={CATEGORY_CONFIG[cat].label}
              icon={<CatIcon size={13} strokeWidth={1.75} aria-hidden />}
              isActive={activeCategory === cat}
              count={counts[cat]}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            />
          );
        })}
      </nav>

      <p className="text-sm text-cockpit-muted">{subtitle}</p>

      {/* Content */}
      {filteredItems.length === 0 ? (
        <EmptyState filtered={isFiltered} />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              parent={item.parent_id ? (parentLookup[item.parent_id] ?? null) : null}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-cockpit-border bg-cockpit-surface shadow-cockpit">
          {filteredItems.map((item) => (
            <InventoryListRow
              key={item.id}
              item={item}
              parent={item.parent_id ? (parentLookup[item.parent_id] ?? null) : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryPillProps {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  count?: number;
  onClick: () => void;
}

function CategoryPill({ label, icon, isActive, count, onClick }: CategoryPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
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
    </button>
  );
}
