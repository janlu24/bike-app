"use client";

import { useState, useTransition, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addTourItemAction } from "@/app/(app)/tours/actions";
import { CATEGORY_CONFIG } from "@/lib/items/categories";
import { formatWeight } from "@/lib/utils/weight";
import type { ItemRow } from "@/types/supabase";
import { Plus, Search, Check } from "lucide-react";

interface ItemPickerSheetProps {
  tourId: string;
  garageItems: ItemRow[];
  packlistItemIds: Set<string>;
}

export function ItemPickerSheet({ tourId, garageItems, packlistItemIds }: ItemPickerSheetProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return garageItems;
    return garageItems.filter(
      (item) =>
        item.brand.toLowerCase().includes(q) ||
        (item.model ?? "").toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [garageItems, search]);

  function handleAdd(itemId: string) {
    setError(null);
    setAdding(itemId);
    startTransition(async () => {
      const result = await addTourItemAction(tourId, itemId);
      setAdding(null);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus size={14} strokeWidth={2} aria-hidden />
          Item hinzufügen
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80dvh] bg-cockpit-surface border-t border-cockpit-border">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left text-base font-semibold text-cockpit-text">
            Item zur Packliste hinzufügen
          </SheetTitle>
        </SheetHeader>

        {error && (
          <p role="alert" className="mb-3 rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="relative mb-4">
          <Search size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-cockpit-muted pointer-events-none" aria-hidden />
          <Input
            placeholder="Marke, Modell oder Kategorie suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Items durchsuchen"
          />
        </div>

        <ScrollArea className="h-[calc(100%-8rem)]">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-cockpit-muted">
              {search ? "Keine Items gefunden." : "Keine Items in der Garage."}
            </p>
          ) : (
            <ul className="space-y-1.5 pb-4" role="list">
              {filtered.map((item) => {
                const config = CATEGORY_CONFIG[item.category];
                const Icon = config.icon;
                const onList = packlistItemIds.has(item.id);
                const isAdding = adding === item.id && isPending;

                return (
                  <li key={item.id}>
                    <div className="flex items-center gap-3 rounded-md border border-cockpit-border bg-cockpit-bg/50 px-3 py-2.5 transition-colors hover:border-petrol-800">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-petrol-800/60 bg-petrol-950/40 text-petrol-300">
                        <Icon size={16} strokeWidth={1.75} aria-hidden />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-cockpit-text truncate">{item.brand}{item.model ? ` ${item.model}` : ""}</p>
                        <p className="text-xs text-cockpit-muted flex items-center gap-2">
                          <span>{config.label}</span>
                          {item.weight_g !== null && (
                            <span className="tabular-nums">{formatWeight(item.weight_g)}</span>
                          )}
                        </p>
                      </div>
                      {onList ? (
                        <Badge variant="outline" className="shrink-0 gap-1 border-petrol-700 text-petrol-400 text-[10px]">
                          <Check size={10} strokeWidth={2.5} aria-hidden />
                          Dabei
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isAdding}
                          onClick={() => handleAdd(item.id)}
                          aria-label={`${item.brand}${item.model ? ` ${item.model}` : ""} hinzufügen`}
                          className="shrink-0 h-7 w-7 p-0"
                        >
                          <Plus size={14} strokeWidth={2} aria-hidden />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
