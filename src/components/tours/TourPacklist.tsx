"use client";

import { useTransition, useState } from "react";
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
  garageItems: ItemRow[];
  isOwner: boolean;
}

function sumWeight(entries: PacklistEntry[]): number | null {
  let total = 0;
  let hasAny = false;
  for (const e of entries) {
    if (e.item.weight_g !== null) {
      total += e.item.weight_g;
      hasAny = true;
    }
  }
  return hasAny ? total : null;
}

export function TourPacklist({ tourId, entries, garageItems, isOwner }: TourPacklistProps) {
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const packlistItemIds = new Set(entries.map((e) => e.item.id));
  const totalWeight = sumWeight(entries);

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
            <div className="flex items-center gap-1.5 text-sm text-cockpit-muted" title="Gesamtgewicht">
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

            return (
              <li
                key={tourItemId}
                className="flex items-center gap-3 rounded-lg border border-cockpit-border bg-cockpit-surface px-3 py-2.5 transition-colors"
              >
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
                  <p className="text-sm font-medium text-cockpit-text truncate">
                    {item.brand}{item.model ? ` ${item.model}` : ""}
                  </p>
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
                    aria-label={`${item.brand}${item.model ? ` ${item.model}` : ""} von Packliste entfernen`}
                    className="shrink-0 h-8 w-8 p-0 text-cockpit-muted hover:text-red-400"
                  >
                    <Trash2 size={14} strokeWidth={1.75} aria-hidden />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
