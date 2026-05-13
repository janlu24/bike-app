"use client";

import { useTransition, useState } from "react";
import { linkComponentToBikeAction } from "@/app/(app)/garage/actions";
import { CATEGORY_CONFIG } from "@/lib/items/categories";
import { formatWeight } from "@/lib/utils/weight";
import type { ItemRow } from "@/types/supabase";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ItemPickerSheetProps {
  bikeId: string;
  availableParts: ItemRow[];
  onLinked: (itemId: string) => void;
}

export function ItemPickerSheet({ bikeId, availableParts, onLinked }: ItemPickerSheetProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(itemId: string) {
    setError(null);
    setPendingId(itemId);
    startTransition(async () => {
      const result = await linkComponentToBikeAction(bikeId, itemId);
      setPendingId(null);
      if ("error" in result) {
        setError(result.error);
      } else {
        onLinked(itemId);
        if (availableParts.length <= 1) setOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => { setError(null); setOpen(true); }}
        className="border-petrol-700 text-petrol-300 hover:border-petrol-500 hover:bg-petrol-950/40"
      >
        <Plus size={14} strokeWidth={2} aria-hidden />
        Komponente hinzufügen
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full max-w-sm border-petrol-800 bg-cockpit-surface p-0">
          <SheetHeader className="border-b border-cockpit-border px-5 py-4">
            <SheetTitle className="text-sm font-medium text-cockpit-text">
              Komponente zuordnen
            </SheetTitle>
          </SheetHeader>

          {error && (
            <p role="alert" className="px-5 pt-3 text-xs text-red-400">
              {error}
            </p>
          )}

          {availableParts.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-cockpit-muted">
              Alle Items sind bereits einem Bike zugeordnet.
            </p>
          ) : (
            <ScrollArea className="h-[calc(100vh-5rem)]">
              <ul className="divide-y divide-cockpit-border/50 px-3 py-2">
                {availableParts.map((item) => {
                  const config = CATEGORY_CONFIG[item.category];
                  const Icon = config.icon;
                  const isAdding = isPending && pendingId === item.id;

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleAdd(item.id)}
                        aria-label={`${item.brand}${item.model ? ` ${item.model}` : ""} zuordnen`}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-3 text-left transition-colors hover:bg-petrol-950/40 disabled:opacity-50"
                      >
                        <span
                          aria-hidden
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-petrol-800/60 bg-petrol-950/40 text-petrol-300"
                        >
                          <Icon size={16} strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-cockpit-text">
                            {item.brand}
                            {item.model ? (
                              <span className="ml-1 font-normal text-petrol-400">{item.model}</span>
                            ) : null}
                          </p>
                          <p className="text-[10px] uppercase tracking-widest text-cockpit-muted">
                            {config.label}
                            {item.weight_g !== null ? ` · ${formatWeight(item.weight_g)}` : ""}
                          </p>
                        </div>
                        {isAdding ? (
                          <span className="text-[11px] text-petrol-400">…</span>
                        ) : (
                          <Plus
                            size={14}
                            strokeWidth={2}
                            className="shrink-0 text-petrol-500"
                            aria-hidden
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
