import { CATEGORY_CONFIG } from "@/lib/items/categories";
import { formatWeight } from "@/lib/utils/weight";
import type { ItemRow } from "@/types/supabase";
import { Link2 } from "lucide-react";
import Link from "next/link";

interface InventoryListRowProps {
  item: ItemRow;
  parent: { id: string; brand: string; model: string | null } | null;
}

export function InventoryListRow({ item, parent }: InventoryListRowProps) {
  const config = CATEGORY_CONFIG[item.category];
  const Icon = config.icon;

  return (
    <Link
      href={`/inventory/${item.id}`}
      className="group flex min-h-[44px] items-center gap-3 border-b border-cockpit-border/50 px-3 py-2 transition-colors hover:bg-petrol-950/30 last:border-b-0"
    >
      <span
        aria-hidden
        className="shrink-0 text-petrol-400 transition-colors group-hover:text-petrol-300"
      >
        <Icon size={15} strokeWidth={1.75} />
      </span>

      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-cockpit-text group-hover:text-petrol-200">
          {item.brand}
        </span>
        {item.model && (
          <span className="ml-1.5 text-sm text-cockpit-muted">{item.model}</span>
        )}
      </div>

      <span className="hidden shrink-0 text-[11px] uppercase tracking-widest text-cockpit-muted sm:block w-24 text-right">
        {config.label}
      </span>

      <span className="shrink-0 w-16 text-right text-xs text-cockpit-muted">
        {item.weight_g !== null ? formatWeight(item.weight_g) : "—"}
      </span>

      {parent ? (
        <span className="hidden shrink-0 items-center gap-1 text-[11px] text-cockpit-muted sm:flex max-w-[140px] min-w-[100px]">
          <Link2 size={10} strokeWidth={1.75} aria-hidden className="shrink-0" />
          <span className="truncate">
            {parent.brand}
            {parent.model ? ` ${parent.model}` : ""}
          </span>
        </span>
      ) : (
        <span className="hidden sm:block shrink-0 min-w-[100px]" aria-hidden />
      )}
    </Link>
  );
}
