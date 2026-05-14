"use client";

import { useState, useTransition, useMemo } from "react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addTourItemAction } from "@/app/(app)/tours/actions";
import { CATEGORY_CONFIG } from "@/lib/items/categories";
import { formatWeight } from "@/lib/utils/weight";
import type { ItemCategory, ItemRow } from "@/types/supabase";

const PACKLIST_CATEGORIES: ItemCategory[] = ["Gear", "Clothing"];
import { Check, Plus, Search } from "lucide-react";

interface ItemPickerSheetProps {
  tourId: string;
  garageItems: ItemRow[];
  packlistItemIds: Set<string>;
}

const ALL_TAB = "all";

export function ItemPickerSheet({ tourId, garageItems, packlistItemIds }: ItemPickerSheetProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Lookup map for parent item names (to show "Montiert an: …" hints).
  const itemById = useMemo(() => {
    const map = new Map<string, ItemRow>();
    for (const item of garageItems) map.set(item.id, item);
    return map;
  }, [garageItems]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return garageItems.filter((item) => {
      const matchesTab = activeTab === ALL_TAB || item.category === activeTab;
      if (!matchesTab) return false;
      if (!q) return true;
      return (
        item.brand.toLowerCase().includes(q) ||
        (item.model ?? "").toLowerCase().includes(q)
      );
    });
  }, [garageItems, search, activeTab]);

  function handleAdd(itemId: string) {
    setError(null);
    setAdding(itemId);
    startTransition(async () => {
      const result = await addTourItemAction(tourId, itemId);
      setAdding(null);
      if (result.error) setError(result.error);
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSearch("");
      setActiveTab(ALL_TAB);
      setError(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus size={14} strokeWidth={2} aria-hidden />
          Item hinzufügen
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80dvh] bg-cockpit-surface border-t border-cockpit-border flex flex-col">
        <SheetHeader className="pb-2 shrink-0">
          <SheetTitle className="text-left text-base font-semibold text-cockpit-text">
            Item zur Packliste hinzufügen
          </SheetTitle>
        </SheetHeader>

        {error && (
          <p role="alert" className="mb-3 rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300 shrink-0">
            {error}
          </p>
        )}

        <div className="relative mb-3 shrink-0">
          <Search size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-cockpit-muted pointer-events-none" aria-hidden />
          <Input
            placeholder="Marke oder Modell suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Items durchsuchen"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <TabsList className="shrink-0 w-full justify-start gap-1 bg-cockpit-bg/60 mb-3 h-8 px-1">
            <TabsTrigger value={ALL_TAB} className="text-xs h-6 px-2.5">Alle</TabsTrigger>
            {PACKLIST_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs h-6 px-2.5">
                {CATEGORY_CONFIG[cat].label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-cockpit-muted">
                  {search ? "Keine Items gefunden." : "Keine Items in dieser Kategorie."}
                </p>
              ) : (
                <ul className="space-y-1.5 pb-4" role="list">
                  {filtered.map((item) => {
                    const config = CATEGORY_CONFIG[item.category];
                    const Icon = config.icon;
                    const onList = packlistItemIds.has(item.id);
                    const isAdding = adding === item.id && isPending;
                    const itemLabel = `${item.brand}${item.model ? ` ${item.model}` : ""}`;
                    const parent = item.parent_id ? itemById.get(item.parent_id) : null;
                    const parentLabel = parent
                      ? `${parent.brand}${parent.model ? ` ${parent.model}` : ""}`
                      : null;

                    return (
                      <li key={item.id}>
                        <div className="flex items-center gap-3 rounded-md border border-cockpit-border bg-cockpit-bg/50 px-3 py-2.5 transition-colors hover:border-petrol-800">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-petrol-800/60 bg-petrol-950/40 text-petrol-300">
                            <Icon size={16} strokeWidth={1.75} aria-hidden />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-cockpit-text truncate">{itemLabel}</p>
                            <p className="text-xs text-cockpit-muted flex items-center gap-2 flex-wrap">
                              <span>{config.label}</span>
                              {item.weight_g !== null && (
                                <span className="tabular-nums">{formatWeight(item.weight_g)}</span>
                              )}
                              {parentLabel && (
                                <span className="text-cockpit-muted/60 truncate">
                                  Montiert an: {parentLabel}
                                </span>
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
                              aria-label={`${itemLabel} hinzufügen`}
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
          </TabsContent>
        </Tabs>

        <div className="shrink-0 pt-3 border-t border-cockpit-border">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              Fertig
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
