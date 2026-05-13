"use client";

import { useEffect, useState, useTransition } from "react";
import {
  addItemToPresetAction,
  removeItemFromPresetAction,
  getPresetSandboxDataAction,
} from "@/app/(app)/garage/actions";
import type { BikePresetWithItems, ItemRow } from "@/types/supabase";
import { CATEGORY_CONFIG } from "@/lib/items/categories";
import { formatWeight } from "@/lib/utils/weight";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Layers, Plus, X } from "lucide-react";

interface PresetSandboxSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset: BikePresetWithItems;
  onPresetItemsChanged: (presetId: string, newItemIds: string[]) => void;
}

export function PresetSandboxSheet({
  open,
  onOpenChange,
  preset,
  onPresetItemsChanged,
}: PresetSandboxSheetProps) {
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mutateError, setMutateError] = useState<string | null>(null);
  const [allUserItems, setAllUserItems] = useState<ItemRow[]>([]);
  const [presetItemIds, setPresetItemIds] = useState<Set<string>>(
    () => new Set(preset.preset_items.map((pi) => pi.item_id))
  );
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setPresetItemIds(new Set(preset.preset_items.map((pi) => pi.item_id)));
    setLoading(true);
    setFetchError(null);
    setMutateError(null);
    getPresetSandboxDataAction(preset.id).then((result) => {
      setLoading(false);
      if ("error" in result) {
        setFetchError(result.error);
      } else {
        setAllUserItems(result.allUserItems);
        setPresetItemIds(new Set(result.currentPresetItemIds));
      }
    });
  }, [open, preset.id]);  // eslint-disable-line react-hooks/exhaustive-deps

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

  const inPreset = allUserItems.filter((i) => presetItemIds.has(i.id));
  const available = allUserItems.filter((i) => !presetItemIds.has(i.id));

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="flex w-full max-w-sm flex-col border-l border-amber-800/60 bg-cockpit-surface p-0"
      >
        {/* Amber mode indicator */}
        <div className="flex items-center gap-2 border-b border-amber-800/60 bg-amber-950/30 px-4 py-2.5">
          <Layers size={13} strokeWidth={1.75} className="shrink-0 text-amber-400" aria-hidden />
          <p className="text-[11px] font-medium uppercase tracking-widest text-amber-300">
            Preset-Bearbeitungsmodus
          </p>
        </div>

        <SheetHeader className="border-b border-cockpit-border px-5 py-4">
          <SheetTitle className="text-sm font-medium text-cockpit-text">
            {preset.name}
          </SheetTitle>
          <p className="mt-0.5 text-[11px] text-cockpit-muted">
            Änderungen hier betreffen nur dieses Preset.{" "}
            <span className="text-amber-300/80">Dein Live-Aufbau bleibt unverändert.</span>
          </p>
        </SheetHeader>

        {fetchError && (
          <div className="flex items-center gap-2 border-b border-red-800/40 bg-red-950/20 px-4 py-2.5">
            <AlertTriangle size={12} strokeWidth={1.75} className="shrink-0 text-red-400" aria-hidden />
            <p role="alert" className="text-xs text-red-400">{fetchError}</p>
          </div>
        )}

        {mutateError && (
          <div className="flex items-center gap-2 border-b border-red-800/40 bg-red-950/20 px-4 py-2">
            <AlertTriangle size={12} strokeWidth={1.75} className="shrink-0 text-red-400" aria-hidden />
            <p role="alert" className="text-xs text-red-400">{mutateError}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-cockpit-border border-t-petrol-400" aria-label="Laden…" />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-4 px-3 py-3">
              {/* Items im Preset */}
              <section aria-label="Im Preset">
                <h3 className="mb-1.5 px-2 text-[10px] uppercase tracking-widest text-amber-400/80">
                  Im Preset · {inPreset.length}
                </h3>
                {inPreset.length === 0 ? (
                  <p className="rounded-md border border-dashed border-amber-800/40 px-4 py-4 text-center text-[11px] text-cockpit-muted">
                    Noch keine Items im Preset. Füge Items aus &ldquo;Verfügbar&rdquo; hinzu.
                  </p>
                ) : (
                  <ul className="divide-y divide-cockpit-border/40">
                    {inPreset.map((item) => {
                      const config = CATEGORY_CONFIG[item.category];
                      const Icon = config.icon;
                      const isThisPending = isPending && pendingItemId === item.id;
                      return (
                        <li key={item.id} className="flex items-center gap-3 px-2 py-2.5">
                          <span
                            aria-hidden
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-petrol-800/60 bg-petrol-950/40 text-petrol-300"
                          >
                            <Icon size={14} strokeWidth={1.75} />
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
              </section>

              {/* Verfügbare Items */}
              <section aria-label="Verfügbare Items">
                <h3 className="mb-1.5 px-2 text-[10px] uppercase tracking-widest text-cockpit-muted">
                  Verfügbar · {available.length}
                </h3>
                {available.length === 0 ? (
                  <p className="rounded-md border border-dashed border-cockpit-border/50 px-4 py-4 text-center text-[11px] text-cockpit-muted">
                    Alle Items sind bereits im Preset.
                  </p>
                ) : (
                  <ul className="divide-y divide-cockpit-border/40">
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
                            className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-petrol-950/40 disabled:opacity-50"
                          >
                            <span
                              aria-hidden
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-petrol-800/60 bg-petrol-950/40 text-petrol-300"
                            >
                              <Icon size={14} strokeWidth={1.75} />
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
                              <Plus size={13} strokeWidth={2} className="shrink-0 text-petrol-500" aria-hidden />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>
          </ScrollArea>
        )}

        <div className="border-t border-cockpit-border px-4 py-3">
          <Button
            size="sm"
            onClick={handleClose}
            className="w-full bg-petrol-800 text-petrol-100 hover:bg-petrol-700"
          >
            Fertig
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
