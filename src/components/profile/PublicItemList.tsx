import { CATEGORY_CONFIG, ITEM_CATEGORIES } from "@/lib/items/categories";
import { formatWeight } from "@/lib/utils/weight";
import type { ItemRow } from "@/types/supabase";
import { Bike } from "lucide-react";

interface PublicItemListProps {
  items: ItemRow[];
}

export function PublicItemList({ items }: PublicItemListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-petrol-800/60 bg-cockpit-surface/60 p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-petrol-700/50 bg-petrol-950/40 text-petrol-300">
          <Bike size={26} strokeWidth={1.5} aria-hidden />
        </div>
        <p className="text-[11px] uppercase tracking-widest text-petrol-300">
          Keine Items
        </p>
        <h2 className="mt-1 text-base font-semibold text-cockpit-text">
          Noch keine öffentlichen Items.
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-cockpit-muted">
          Dieser Nutzer hat noch keine Items als öffentlich markiert.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {ITEM_CATEGORIES.map((category) => {
        const group = items.filter((i) => i.category === category);
        if (group.length === 0) return null;
        const config = CATEGORY_CONFIG[category];
        const Icon = config.icon;
        return (
          <section key={category} className="space-y-3">
            <header className="flex items-center gap-2">
              <Icon size={14} strokeWidth={1.75} className="text-petrol-400" aria-hidden />
              <h2 className="text-[11px] uppercase tracking-widest text-cockpit-muted">
                {config.label}
              </h2>
              <span className="text-[11px] text-cockpit-muted">· {group.length}</span>
            </header>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((item) => (
                <PublicItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function PublicItemCard({ item }: { item: ItemRow }) {
  const config = CATEGORY_CONFIG[item.category];
  const Icon = config.icon;
  const allEntries = Object.entries(
    (item.metadata as Record<string, unknown>) ?? {}
  );

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-cockpit-border bg-cockpit-surface shadow-cockpit">
      {item.image_url && (
        <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-cockpit-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image_url}
            alt={`${item.brand ?? ""} ${item.model ?? ""}`.trim()}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cockpit-surface/80 via-petrol-950/20 to-transparent"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-petrol-800/60 bg-petrol-950/40 text-petrol-300"
          >
            <Icon size={18} strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-cockpit-muted">
              {config.label}
            </p>
            <h3 className="text-sm font-semibold text-cockpit-text">{item.brand}</h3>
            {item.model && (
              <p className="text-xs text-cockpit-muted">{item.model}</p>
            )}
          </div>
        </header>

        {(item.weight_g !== null || allEntries.length > 0) && (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-cockpit-border pt-3 text-xs">
            {item.weight_g !== null && (
              <div className="col-span-2 flex items-baseline justify-between">
                <dt className="uppercase tracking-widest text-cockpit-muted">Gewicht</dt>
                <dd className="text-cockpit-text">{formatWeight(item.weight_g)}</dd>
              </div>
            )}
            {allEntries.slice(0, 5).map(([key, value]) => (
              <div
                key={key}
                className="col-span-2 flex items-baseline justify-between gap-2"
              >
                <dt className="truncate text-cockpit-muted">{key}</dt>
                <dd className="truncate text-right text-cockpit-text">{String(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}
