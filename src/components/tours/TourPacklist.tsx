"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemPickerSheet } from "./ItemPickerSheet";
import { FeedbackSheet } from "./FeedbackSheet";
import { StarDisplay } from "./StarDisplay";
import { removeTourItemAction } from "@/app/(app)/tours/actions";
import { CATEGORY_CONFIG, ITEM_CATEGORIES } from "@/lib/items/categories";
import { formatWeight } from "@/lib/utils/weight";
import type { ItemCategory, ItemRow } from "@/types/supabase";
import { Badge } from "@/components/ui/badge";
import { Scale, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface PacklistEntry {
  tourItemId: string;
  item: ItemRow;
  rating: number | null;
  note: string | null;
}

interface TourPacklistProps {
  tourId: string;
  entries: PacklistEntry[];
  /** Map of parent item ID → child items auto-included from garage (mounted components). */
  childItemMap: Map<string, ItemRow[]>;
  /** Map of child item ID → feedback (from tour_items rows created via feedback upsert). */
  childFeedbackMap: Map<string, { rating: number | null; note: string | null }>;
  garageItems: ItemRow[];
  isOwner: boolean;
  /** Map of bike item ID → preset name; when present, children come from the preset, not live parent_id. */
  presetBadgeMap?: Map<string, string>;
}

const ALL_TAB = "all";

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

export function TourPacklist({ tourId, entries, childItemMap, childFeedbackMap, garageItems, isOwner, presetBadgeMap }: TourPacklistProps) {
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  function toggleNote(tourItemId: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(tourItemId)) next.delete(tourItemId);
      else next.add(tourItemId);
      return next;
    });
  }

  const packlistItemIds = new Set(entries.map((e) => e.item.id));
  const totalWeight = sumAllWeights(entries, childItemMap);

  const filteredEntries =
    activeTab === ALL_TAB
      ? entries
      : entries.filter((e) => e.item.category === (activeTab as ItemCategory));

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
        <>
          {/* Category filter tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start gap-1 bg-cockpit-bg/60 h-8 px-1">
              <TabsTrigger value={ALL_TAB} className="text-xs h-6 px-2.5">
                Alle
              </TabsTrigger>
              {ITEM_CATEGORIES.map((cat) => {
                const count = entries.filter((e) => e.item.category === cat).length;
                if (count === 0) return null;
                return (
                  <TabsTrigger key={cat} value={cat} className="text-xs h-6 px-2.5">
                    {CATEGORY_CONFIG[cat as ItemCategory].label}
                    <span className="ml-1 opacity-60">({count})</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {/* Item list */}
          {filteredEntries.length === 0 ? (
            <p className="py-6 text-center text-sm text-cockpit-muted">
              Keine Items in dieser Kategorie.
            </p>
          ) : (
            <ul className="space-y-2" role="list" aria-label="Packliste">
              {filteredEntries.map(({ tourItemId, item, rating, note }) => {
                const config = CATEGORY_CONFIG[item.category];
                const Icon = config.icon;
                const isRemoving = removing === item.id && isPending;
                // Only bikes have mounted child items in the childItemMap.
                const children = item.category === "Bike" ? (childItemMap.get(item.id) ?? []) : [];
                const presetName = presetBadgeMap?.get(item.id) ?? null;
                const itemLabel = `${item.brand}${item.model ? ` ${item.model}` : ""}`;
                const hasFeedback = rating !== null || (note !== null && note.length > 0);
                const isNoteExpanded = expandedNotes.has(tourItemId);
                const NOTE_PREVIEW_LEN = 100;

                return (
                  <li key={tourItemId} className="rounded-lg border border-cockpit-border bg-cockpit-surface overflow-hidden">
                    {/* Main item row */}
                    <div className="flex items-center gap-3 px-3 py-2.5">
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/garage/${item.id}`}
                            className="text-sm font-medium text-cockpit-text hover:text-petrol-300 transition-colors truncate"
                            aria-label={`${itemLabel} in der Garage ansehen`}
                          >
                            {itemLabel}
                          </Link>
                          {presetName && (
                            <Badge
                              variant="outline"
                              className="shrink-0 border-amber-700/60 bg-amber-950/30 px-1.5 py-0 text-[9px] font-normal text-amber-300"
                            >
                              Preset: {presetName}
                            </Badge>
                          )}
                        </div>
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

                    {/* Feedback section */}
                    {(hasFeedback || isOwner) && (
                      <div className="border-t border-cockpit-border/30 bg-cockpit-bg/20 px-3 py-2 flex items-start justify-between gap-3 min-h-[2.25rem]">
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          {rating !== null && <StarDisplay rating={rating} size={13} />}
                          {note && (
                            <div className="text-xs text-cockpit-muted">
                              <span>
                                {isNoteExpanded || note.length <= NOTE_PREVIEW_LEN
                                  ? note
                                  : `${note.slice(0, NOTE_PREVIEW_LEN)}…`}
                              </span>
                              {note.length > NOTE_PREVIEW_LEN && (
                                <button
                                  type="button"
                                  onClick={() => toggleNote(tourItemId)}
                                  className="ml-1.5 inline-flex items-center gap-0.5 text-petrol-400 hover:text-petrol-300 transition-colors"
                                  aria-label={isNoteExpanded ? "Notiz einklappen" : "Notiz vollständig anzeigen"}
                                >
                                  {isNoteExpanded ? (
                                    <ChevronUp size={12} strokeWidth={1.75} aria-hidden />
                                  ) : (
                                    <ChevronDown size={12} strokeWidth={1.75} aria-hidden />
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                          {!hasFeedback && isOwner && (
                            <span className="text-[11px] italic text-cockpit-muted/50">Kein Feedback</span>
                          )}
                        </div>

                        {isOwner && (
                          <FeedbackSheet
                            tourId={tourId}
                            itemId={item.id}
                            itemLabel={itemLabel}
                            initialRating={rating}
                            initialNote={note}
                          />
                        )}
                      </div>
                    )}

                    {/* Mounted child items auto-included from garage (only for Bikes) */}
                    {children.length > 0 && (
                      <ul className="border-t border-cockpit-border/50 bg-cockpit-bg/30" aria-label={`Komponenten von ${itemLabel}`}>
                        {children.map((child) => {
                          const childConfig = CATEGORY_CONFIG[child.category];
                          const ChildIcon = childConfig.icon;
                          const childLabel = `${child.brand}${child.model ? ` ${child.model}` : ""}`;
                          const childFeedback = childFeedbackMap.get(child.id) ?? { rating: null, note: null };
                          const childHasFeedback = childFeedback.rating !== null || (childFeedback.note !== null && childFeedback.note.length > 0);
                          const isChildNoteExpanded = expandedNotes.has(child.id);

                          return (
                            <li key={child.id} className="border-b border-cockpit-border/30 last:border-b-0">
                              {/* Child item row */}
                              <div className="flex items-center gap-2.5 px-3 py-1.5">
                                <span className="w-10 flex justify-center shrink-0 opacity-50">
                                  <ChildIcon size={13} strokeWidth={1.75} aria-hidden className="text-petrol-400" />
                                </span>
                                <Link
                                  href={`/garage/${child.id}`}
                                  className="flex-1 min-w-0 text-xs text-cockpit-muted hover:text-petrol-300 transition-colors truncate"
                                  aria-label={`${childLabel} in der Garage ansehen`}
                                >
                                  {childLabel}
                                </Link>
                                {child.weight_g !== null && (
                                  <span className="text-xs tabular-nums text-cockpit-muted shrink-0">
                                    {formatWeight(child.weight_g)}
                                  </span>
                                )}
                              </div>

                              {/* Child feedback section */}
                              {(childHasFeedback || isOwner) && (
                                <div className="flex items-start justify-between gap-2 pl-[3.25rem] pr-3 pb-2">
                                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                                    {childFeedback.rating !== null && (
                                      <StarDisplay rating={childFeedback.rating} size={12} />
                                    )}
                                    {childFeedback.note && (
                                      <div className="text-xs text-cockpit-muted">
                                        <span>
                                          {isChildNoteExpanded || childFeedback.note.length <= NOTE_PREVIEW_LEN
                                            ? childFeedback.note
                                            : `${childFeedback.note.slice(0, NOTE_PREVIEW_LEN)}…`}
                                        </span>
                                        {childFeedback.note.length > NOTE_PREVIEW_LEN && (
                                          <button
                                            type="button"
                                            onClick={() => toggleNote(child.id)}
                                            className="ml-1.5 inline-flex items-center gap-0.5 text-petrol-400 hover:text-petrol-300 transition-colors"
                                            aria-label={isChildNoteExpanded ? "Notiz einklappen" : "Notiz vollständig anzeigen"}
                                          >
                                            {isChildNoteExpanded ? (
                                              <ChevronUp size={12} strokeWidth={1.75} aria-hidden />
                                            ) : (
                                              <ChevronDown size={12} strokeWidth={1.75} aria-hidden />
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    {!childHasFeedback && isOwner && (
                                      <span className="text-[11px] italic text-cockpit-muted/50">Kein Feedback</span>
                                    )}
                                  </div>
                                  {isOwner && (
                                    <FeedbackSheet
                                      tourId={tourId}
                                      itemId={child.id}
                                      itemLabel={childLabel}
                                      initialRating={childFeedback.rating}
                                      initialNote={childFeedback.note}
                                    />
                                  )}
                                </div>
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
        </>
      )}
    </section>
  );
}
