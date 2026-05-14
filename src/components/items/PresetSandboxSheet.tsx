"use client";

import { useEffect, useState, useTransition } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  addItemToPresetAction,
  removeItemFromPresetAction,
  getPresetSandboxDataAction,
} from "@/app/(app)/garage/actions";
import type { PresetApplyDiff } from "@/app/(app)/garage/actions";
import type { BikePresetWithItems, ItemRow } from "@/types/supabase";
import { CATEGORY_CONFIG } from "@/lib/items/categories";
import { formatWeight } from "@/lib/utils/weight";
import { Dialog, DialogOverlay } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, Layers, Play, Plus, Scale, X } from "lucide-react";
import { ApplyPresetDialog } from "./ApplyPresetDialog";

interface PresetSandboxSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset: BikePresetWithItems;
  onPresetItemsChanged: (presetId: string, newItemIds: string[]) => void;
  liveTotalWeightG: number;
  bikeWeightG: number | null;
  onPresetApplied?: (diff: PresetApplyDiff) => void;
}

function computeSubtreeWeight(rootId: string, allItems: ItemRow[]): number {
  let total = 0;
  const stack = [rootId];
  const visited = new Set<string>();
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const children = allItems.filter((i) => i.parent_id === id);
    for (const child of children) {
      total += child.weight_g ?? 0;
      stack.push(child.id);
    }
  }
  return total;
}

function formatDelta(deltaG: number): string {
  const prefix = deltaG >= 0 ? "+" : "−";
  return `${prefix}${formatWeight(Math.abs(deltaG))}`;
}

export function PresetSandboxSheet({
  open,
  onOpenChange,
  preset,
  onPresetItemsChanged,
  liveTotalWeightG,
  bikeWeightG,
  onPresetApplied,
}: PresetSandboxSheetProps) {
  const [loading, setLoading] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mutateError, setMutateError] = useState<string | null>(null);
  const [allUserItems, setAllUserItems] = useState<ItemRow[]>([]);
  const [bikeIdToName, setBikeIdToName] = useState<Map<string, string>>(new Map());
  const [presetItemIds, setPresetItemIds] = useState<Set<string>>(
    () => new Set(preset.preset_items.map((pi) => pi.item_id))
  );
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setFetchDone(false);
      setAllUserItems([]);
      setBikeIdToName(new Map());
      return;
    }
    setPresetItemIds(new Set(preset.preset_items.map((pi) => pi.item_id)));
    setLoading(true);
    setFetchDone(false);
    setFetchError(null);
    setMutateError(null);
    getPresetSandboxDataAction(preset.id).then((result) => {
      setLoading(false);
      setFetchDone(true);
      if ("error" in result) {
        setFetchError(result.error);
      } else {
        setAllUserItems(result.allUserItems);
        setPresetItemIds(new Set(result.currentPresetItemIds));
        const nameMap = new Map<string, string>();
        for (const bike of result.userBikes) {
          nameMap.set(bike.id, [bike.brand, bike.model].filter(Boolean).join(" "));
        }
        setBikeIdToName(nameMap);
      }
    });
  }, [open, preset.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    onPresetItemsChanged(preset.id, [...presetItemIds]);
    onOpenChange(false);
  }

  function handleAdd(itemId: string) {
    setMutateError(null);
    setPendingItemId(itemId);
    startTransition(async () => {
      const result = await addItemToPresetAction(preset.id, itemId);
      setPendingItemId(null);
      if ("error" in result) {
        setMutateError(result.error);
      } else {
        setPresetItemIds((prev) => new Set([...prev, itemId]));
      }
    });
  }

  function handleRemove(itemId: string) {
    setMutateError(null);
    setPendingItemId(itemId);
    startTransition(async () => {
      const result = await removeItemFromPresetAction(preset.id, itemId);
      setPendingItemId(null);
      if ("error" in result) {
        setMutateError(result.error);
      } else {
        setPresetItemIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
    });
  }

  // Top-level plannable items: parent_id is null (free) or points to a bike (mounted).
  // Sub-items (parent_id is another component) are kept in allUserItems only for weight
  // calculation via computeSubtreeWeight — they are never individually plannable.
  const bikeIds = new Set(bikeIdToName.keys());
  const topLevelItems = allUserItems.filter(
    (i) => i.parent_id === null || bikeIds.has(i.parent_id)
  );

  // Derived: items in preset vs available — only meaningful after fetch
  const inPreset = topLevelItems.filter((i) => presetItemIds.has(i.id));
  const available = topLevelItems.filter((i) => !presetItemIds.has(i.id));

  // Weight calculation
  const presetWeightG =
    (bikeWeightG ?? 0) +
    [...presetItemIds].reduce((sum, itemId) => {
      const item = allUserItems.find((i) => i.id === itemId);
      return sum + (item?.weight_g ?? 0) + computeSubtreeWeight(itemId, allUserItems);
    }, 0);

  const deltaG = presetWeightG - liveTotalWeightG;
  const showWeightBar = fetchDone && !fetchError;

  const isReady = fetchDone && !loading;

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogPrimitive.Portal>
          <DialogOverlay className="bg-black/70" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-1/2 z-50 flex h-[88vh] w-[92vw] max-w-[1200px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-amber-800/60 bg-cockpit-surface shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          >
            {/* ── Fixed top: amber sandbox banner ── */}
            <div
              role="status"
              aria-label={`Sandbox-Modus aktiv: ${preset.name}`}
              className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-800/60 bg-amber-950/40 px-5 py-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Layers size={14} strokeWidth={1.75} className="shrink-0 text-amber-400" aria-hidden />
                <DialogPrimitive.Title className="truncate text-[11px] font-semibold uppercase tracking-widest text-amber-300">
                  Sandbox — {preset.name}
                </DialogPrimitive.Title>
                <span className="shrink-0 rounded border border-amber-700/50 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-amber-400/70">
                  Planungsmodus
                </span>
              </div>
              <p className="hidden shrink-0 text-[11px] text-amber-400/60 sm:block">
                Dein Live-Aufbau bleibt unverändert
              </p>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Sandbox beenden"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-amber-800/40 text-amber-400/70 transition-colors hover:border-amber-600/60 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
              >
                <X size={14} strokeWidth={2} aria-hidden />
              </button>
            </div>

            {/* ── Fixed: weight stats bar ── */}
            {showWeightBar && (
              <div className="flex shrink-0 items-center gap-8 border-b border-cockpit-border bg-cockpit-bg/70 px-5 py-2.5">
                <div className="flex items-center gap-2 text-cockpit-muted">
                  <Scale size={12} strokeWidth={1.75} aria-hidden />
                  <span className="text-[10px] uppercase tracking-widest">Gewicht</span>
                </div>
                <div className="flex items-center gap-8">
                  <WeightStat
                    label="Preset"
                    value={formatWeight(presetWeightG)}
                    className="text-amber-300"
                  />
                  <WeightStat
                    label="Live"
                    value={formatWeight(liveTotalWeightG)}
                    className="text-cockpit-muted"
                  />
                  <WeightStat
                    label="Differenz"
                    value={formatDelta(deltaG)}
                    className={
                      deltaG === 0
                        ? "text-cockpit-muted"
                        : deltaG < 0
                        ? "text-green-400"
                        : "text-amber-300"
                    }
                  />
                </div>
              </div>
            )}

            {/* ── Error banners ── */}
            {fetchError && (
              <div className="flex shrink-0 items-center gap-2 border-b border-red-800/40 bg-red-950/20 px-5 py-2.5">
                <AlertTriangle size={12} strokeWidth={1.75} className="shrink-0 text-red-400" aria-hidden />
                <p role="alert" className="text-xs text-red-400">{fetchError}</p>
              </div>
            )}
            {mutateError && (
              <div className="flex shrink-0 items-center gap-2 border-b border-red-800/40 bg-red-950/20 px-4 py-2">
                <AlertTriangle size={12} strokeWidth={1.75} className="shrink-0 text-red-400" aria-hidden />
                <p role="alert" className="text-xs text-red-400">{mutateError}</p>
              </div>
            )}

            {/* ── Main content: spinner or two-column layout ── */}
            <div className="flex-1 overflow-hidden min-h-0">
              {!isReady ? (
                <div className="flex h-full items-center justify-center">
                  <span
                    className="h-6 w-6 animate-spin rounded-full border-2 border-cockpit-border border-t-petrol-400"
                    aria-label="Laden…"
                  />
                </div>
              ) : (
                <div className="grid h-full grid-cols-2 divide-x divide-cockpit-border">

                  {/* ── Left column: Im Preset ── */}
                  <div className="flex flex-col overflow-hidden">
                    <div className="flex shrink-0 items-center justify-between border-b border-cockpit-border/60 px-4 py-2.5">
                      <h2 className="text-[10px] uppercase tracking-widest text-amber-400/80">
                        Im Preset
                      </h2>
                      <span className="text-[10px] text-cockpit-muted">{inPreset.length} Items</span>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                      {inPreset.length === 0 ? (
                        <div className="flex h-40 items-center justify-center px-6 text-center">
                          <p className="text-[11px] text-cockpit-muted">
                            Noch keine Items im Preset.
                            <br />
                            <span className="text-amber-400/60">Füge Items aus der rechten Spalte hinzu.</span>
                          </p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-cockpit-border/40 py-1">
                          {inPreset.map((item) => {
                            const config = CATEGORY_CONFIG[item.category];
                            const Icon = config.icon;
                            const isThisPending = isPending && pendingItemId === item.id;
                            const isConflict =
                              item.parent_id !== null && item.parent_id !== preset.bike_id;
                            const conflictBikeName = isConflict
                              ? (bikeIdToName.get(item.parent_id!) ?? "einem anderen Bike")
                              : null;

                            return (
                              <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                                <span
                                  aria-hidden
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-petrol-800/60 bg-petrol-950/40 text-petrol-300"
                                >
                                  <Icon size={15} strokeWidth={1.75} />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className="truncate text-sm font-medium text-cockpit-text">
                                      {item.brand}
                                      {item.model && (
                                        <span className="ml-1 font-normal text-petrol-400">{item.model}</span>
                                      )}
                                    </p>
                                    {isConflict && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span
                                            aria-label={`Konflikt: Aktuell an ${conflictBikeName} montiert`}
                                            className="inline-flex shrink-0 cursor-default"
                                          >
                                            <AlertTriangle
                                              size={11}
                                              strokeWidth={1.75}
                                              className="text-amber-400"
                                              aria-hidden
                                            />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          side="top"
                                          className="border-amber-800/60 bg-amber-950 text-[11px] text-amber-200"
                                        >
                                          Aktuell montiert an: {conflictBikeName}
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                  <p className="text-[10px] uppercase tracking-widest text-cockpit-muted">
                                    {config.label}
                                    {item.weight_g !== null ? ` · ${formatWeight(item.weight_g)}` : ""}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemove(item.id)}
                                  disabled={isPending}
                                  aria-label={`${item.brand}${item.model ? ` ${item.model}` : ""} aus Preset entfernen`}
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-cockpit-border/60 text-cockpit-muted/60 transition-colors hover:border-red-800/60 hover:text-red-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-petrol-500 disabled:opacity-40"
                                >
                                  {isThisPending ? (
                                    <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" aria-hidden />
                                  ) : (
                                    <X size={11} strokeWidth={2} aria-hidden />
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </ScrollArea>
                  </div>

                  {/* ── Right column: Verfügbar im Lager ── */}
                  <div className="flex flex-col overflow-hidden">
                    <div className="flex shrink-0 items-center justify-between border-b border-cockpit-border/60 px-4 py-2.5">
                      <h2 className="text-[10px] uppercase tracking-widest text-cockpit-muted">
                        Verfügbar im Lager
                      </h2>
                      <span className="text-[10px] text-cockpit-muted">{available.length} Items</span>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                      {available.length === 0 ? (
                        <div className="flex h-40 items-center justify-center px-6 text-center">
                          <p className="text-[11px] text-cockpit-muted">
                            {allUserItems.length === 0
                              ? "Keine Items in der Garage vorhanden."
                              : "Alle Items sind bereits im Preset."}
                          </p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-cockpit-border/40 py-1">
                          {available.map((item) => {
                            const config = CATEGORY_CONFIG[item.category];
                            const Icon = config.icon;
                            const isThisPending = isPending && pendingItemId === item.id;
                            return (
                              <li key={item.id}>
                                <button
                                  type="button"
                                  onClick={() => handleAdd(item.id)}
                                  disabled={isPending}
                                  aria-label={`${item.brand}${item.model ? ` ${item.model}` : ""} zum Preset hinzufügen`}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-petrol-950/40 disabled:opacity-50"
                                >
                                  <span
                                    aria-hidden
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-petrol-800/60 bg-petrol-950/40 text-petrol-300"
                                  >
                                    <Icon size={15} strokeWidth={1.75} />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-cockpit-text">
                                      {item.brand}
                                      {item.model && (
                                        <span className="ml-1 font-normal text-petrol-400">{item.model}</span>
                                      )}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-widest text-cockpit-muted">
                                      {config.label}
                                      {item.weight_g !== null ? ` · ${formatWeight(item.weight_g)}` : ""}
                                    </p>
                                  </div>
                                  {isThisPending ? (
                                    <span className="h-3 w-3 animate-spin rounded-full border border-petrol-400 border-t-transparent" aria-hidden />
                                  ) : (
                                    <Plus size={14} strokeWidth={2} className="shrink-0 text-petrol-500" aria-hidden />
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </ScrollArea>
                  </div>

                </div>
              )}
            </div>

            {/* ── Fixed footer ── */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-cockpit-border bg-cockpit-bg/40 px-5 py-3">
              <p className="hidden text-[11px] text-cockpit-muted/60 sm:block">
                Änderungen werden sofort gespeichert
              </p>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClose}
                  className="border-cockpit-border text-cockpit-muted hover:border-cockpit-border hover:text-cockpit-text"
                >
                  Fertig
                </Button>
                {onPresetApplied && (
                  <Button
                    size="sm"
                    onClick={() => setApplyOpen(true)}
                    disabled={!isReady || !!fetchError}
                    className="bg-petrol-700 text-white hover:bg-petrol-600"
                  >
                    <Play size={12} strokeWidth={1.75} aria-hidden className="mr-1.5" />
                    Preset anwenden
                  </Button>
                )}
              </div>
            </div>

          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </Dialog>

      {onPresetApplied && (
        <ApplyPresetDialog
          open={applyOpen}
          onOpenChange={setApplyOpen}
          presetId={preset.id}
          presetName={preset.name}
          onApplied={(diff) => {
            setApplyOpen(false);
            onPresetApplied(diff);
          }}
        />
      )}
    </TooltipProvider>
  );
}

function WeightStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-cockpit-muted/70">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${className ?? ""}`}>{value}</p>
    </div>
  );
}
