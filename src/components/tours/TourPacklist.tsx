"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ItemPickerSheet } from "./ItemPickerSheet";
import { removeTourItemAction } from "@/app/(app)/tours/actions";
import { CATEGORY_CONFIG } from "@/lib/items/categories";
import { formatWeight } from "@/lib/utils/weight";
import type { ItemRow } from "@/types/supabase";
import { Scale, Trash2 } from "lucide-react";

interface PacklistEntry {
  tourItemId: string;
  item: ItemRow;
}

interface TourPacklistProps {
  tourId: string;
  entries: PacklistEntry[];
  /** Map of parent item ID → child items (from the user's garage, not explicitly added). */
  childItemMap: Map<string, ItemRow[]>;
  garageItems: ItemRow[];
  isOwner: boolean;
}

function sumAllWeights(entries: PacklistEntry[], childItemMap: Map<string, ItemRow[]>): number | null {
  let total = 0;
  let hasAny = false;
  for (const e of entries) {
    if (e.item.weight_g !== null) {
      total += e.item.weight_g;
      hasAny = true;
    }
    for (const child of childItemMap.get(e.item.id) ?? []) {
      if (child.weight_g !== null) {
        total += child.weight_g;
        hasAny = true;
      }
    }
  }
  return hasAny ? total : null;
}

export function TourPacklist({ tourId, entries, childItemMap, garageItems, isOwner }: TourPacklistProps) {
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const packlistItemIds = new Set(entries.map((e) => e.item.id));
  const totalWeight = sumAllWeights(entries, childItemMap);

  function handleRemove(itemId: string) {
    setError(null);
    setRemoving(itemId);
    startTransition(async () => {
      const result = await removeTourItemAction(tourId, itemId);
      setRemoving(null);
      if (result.error) setError(result.error);
    });
  }

  return (
    <section aria-labelledby="packlist-heading" className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">Packliste</p>
          <h2 id="packlist-heading" className="text-lg font-semibold text-cockpit-text">
            {entries.length} Item{entries.length !== 1 ? "s" : ""}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {totalWeight !== null && (
            <div className="flex items-center gap-1.5 text-sm text-cockpit-muted" title="Gesamtgewicht inkl. verknüpfter Komponenten">
              <Scale size={14} strokeWidth={1.75} aria-hidden />
              <span className="tabular-nums font-medium text-cockpit-text" aria-label={`Gesamtgewicht: ${formatWeight(totalWeight)}`}>
                {formatWeight(totalWeight)}
              </span>
            </div>
          )}
          {isOwner && (
            <ItemPickerSheet
              tourId={tourId}
              garageItems={garageItems}
              packlistItemIds={packlistItemIds}
            />
          )}
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-cockpit-border py-10 text-center">
          <p className="text-sm text-cockpit-muted">Noch keine Items auf der Packliste.</p>
          {isOwner && (
            <p className="mt-1 text-xs text-cockpit-muted">Klicke auf „Item hinzufügen" um loszulegen.</p>
          )}
        </div>
      ) : (
        <ul className="space-y-2" role="list" aria-label="Packliste">
          {entries.map(({ tourItemId, item }) => {
            const config = CATEGORY_CONFIG[item.category];
            const Icon = config.icon;
            const isRemoving = removing === item.id && isPending;
            const children = childItemMap.get(item.id) ?? [];
            const itemLabel = `${item.brand}${item.model ? ` ${item.model}` : ""}`;

            return (
              <li key={tourItemId} className="rounded-lg border border-cockpit-border bg-cockpit-surface overflow-hidden">
                {/* Main item row */}
                <div className="flex items-center gap-3 px-3 py-2.5 transition-colors">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt=""
                      aria-hidden
                      className="h-10 w-10 shrink-0 rounded-md object-cover border border-cockpit-border"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-petrol-800/60 bg-petrol-950/40 text-petrol-300">
                      <Icon size={18} strokeWidth={1.75} aria-hidden />
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/garage/${item.id}`}
                      className="text-sm font-medium text-cockpit-text hover:text-petrol-300 transition-colors truncate block"
                      aria-label={`${itemLabel} in der Garage öffnen`}
                    >
                      {itemLabel}
                    </Link>
                    <p className="text-xs text-cockpit-muted flex items-center gap-2">
                      <span>{config.label}</span>
                      {item.weight_g !== null && (
                        <span className="tabular-nums">{formatWeight(item.weight_g)}</span>
                      )}
                    </p>
                  </div>

                  {isOwner && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isRemoving}
                      onClick={() => handleRemove(item.id)}
                      aria-label={`${itemLabel} von Packliste entfernen`}
                      className="shrink-0 h-8 w-8 p-0 text-cockpit-muted hover:text-red-400"
                    >
                      <Trash2 size={14} strokeWidth={1.75} aria-hidden />
                    </Button>
                  )}
                </div>

                {/* Linked child items (auto-included from garage) */}
                {children.length > 0 && (
                  <ul className="border-t border-cockpit-border/50 bg-cockpit-bg/30" aria-label={`Komponenten von ${itemLabel}`}>
                    {children.map((child) => {
                      const childConfig = CATEGORY_CONFIG[child.category];
                      const ChildIcon = childConfig.icon;
                      const childLabel = `${child.brand}${child.model ? ` ${child.model}` : ""}`;
                      return (
                        <li key={child.id} className="flex items-center gap-2.5 px-3 py-1.5 border-b border-cockpit-border/30 last:border-b-0">
                          <span className="w-10 flex justify-center shrink-0 opacity-50">
                            <ChildIcon size={13} strokeWidth={1.75} aria-hidden className="text-petrol-400" />
                          </span>
                          <Link
                            href={`/garage/${child.id}`}
                            className="flex-1 min-w-0 text-xs text-cockpit-muted hover:text-petrol-300 transition-colors truncate"
                            aria-label={`${childLabel} in der Garage öffnen`}
                          >
                            {childLabel}
                          </Link>
                          {child.weight_g !== null && (
                            <span className="text-xs tabular-nums text-cockpit-muted shrink-0">
                              {formatWeight(child.weight_g)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
