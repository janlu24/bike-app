import type { ItemCategory } from "@/types/supabase";
import { Backpack, Bike, Cog, Shirt, type LucideIcon } from "lucide-react";

export interface CategoryDescriptor {
  label: string;
  icon: LucideIcon;
  emptyHint: string;
  tooltip: string;
}

export const ITEM_CATEGORIES: ItemCategory[] = ["Bike", "Part", "Gear", "Clothing"];

export const CATEGORY_CONFIG: Record<ItemCategory, CategoryDescriptor> = {
  Bike: {
    label: "Bike",
    icon: Bike,
    emptyHint: "Noch keine Bikes erfasst.",
    tooltip: "Komplette Räder – sie tragen die zugeordneten Komponenten.",
  },
  Part: {
    label: "Komponenten",
    icon: Cog,
    emptyHint: "Noch keine Komponenten registriert.",
    tooltip: "Komponenten: Dinge, die fest am Fahrrad verbaut sind (z. B. Bremsen, Gabel, Schaltung, fest montierte Taschen).",
  },
  Gear: {
    label: "Equipment",
    icon: Backpack,
    emptyHint: "Noch kein Equipment in der Library.",
    tooltip: "Equipment: Dinge, die man flexibel auf eine Tour mitnimmt (z. B. Zelt, Werkzeug, Powerbanks, Kleidung).",
  },
  Clothing: {
    label: "Bekleidung",
    icon: Shirt,
    emptyHint: "Noch keine Bekleidung erfasst.",
    tooltip: "Bekleidung – Trikots, Hosen, Schuhe; reist mit, gehört aber nicht ans Bike.",
  },
};

export function isItemCategory(value: unknown): value is ItemCategory {
  return typeof value === "string" && (ITEM_CATEGORIES as string[]).includes(value);
}
