import type { ItemCategory } from "@/types/supabase";
import { Backpack, Bike, Cog, Shirt, type LucideIcon } from "lucide-react";

export interface CategoryDescriptor {
  label: string;
  icon: LucideIcon;
  emptyHint: string;
}

export const ITEM_CATEGORIES: ItemCategory[] = ["Bike", "Part", "Gear", "Clothing"];

export const CATEGORY_CONFIG: Record<ItemCategory, CategoryDescriptor> = {
  Bike: {
    label: "Bike",
    icon: Bike,
    emptyHint: "Noch keine Bikes erfasst.",
  },
  Part: {
    label: "Komponenten",
    icon: Cog,
    emptyHint: "Noch keine Komponenten registriert.",
  },
  Gear: {
    label: "Equipment",
    icon: Backpack,
    emptyHint: "Noch kein Equipment in der Library.",
  },
  Clothing: {
    label: "Bekleidung",
    icon: Shirt,
    emptyHint: "Noch keine Bekleidung erfasst.",
  },
};

export function isItemCategory(value: unknown): value is ItemCategory {
  return typeof value === "string" && (ITEM_CATEGORIES as string[]).includes(value);
}
