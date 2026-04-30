import type { ItemCategory } from "@/types/supabase";
import { isItemCategory } from "./categories";
import { parseToGrams } from "@/lib/utils/weight";

export interface ItemInput {
  category: ItemCategory;
  brand: string;
  model: string;
  weight_g: number | null;
  is_public: boolean;
  metadata: Record<string, string>;
  parent_id: string | null;
}

export type ItemFieldError =
  | "category"
  | "brand"
  | "model"
  | "weight_g"
  | "metadata"
  | "parent_id";

export interface ItemValidationResult {
  data: ItemInput | null;
  fieldErrors: Partial<Record<ItemFieldError, string>>;
}

// Only Parts are permanently attached to a bike.
export const CATEGORIES_WITH_PARENT: ItemCategory[] = ["Part"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BRAND = 80;
const MAX_MODEL = 120;
const MAX_KEY = 40;
const MAX_VALUE = 200;
const MAX_METADATA_ENTRIES = 25;

function sanitize(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseMetadata(
  formData: FormData
): { metadata: Record<string, string>; error?: string } {
  const keys = formData.getAll("meta_key").map((v) => sanitize(v));
  const values = formData.getAll("meta_value").map((v) => sanitize(v));
  const metadata: Record<string, string> = {};
  const seen = new Set<string>();
  let count = 0;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i] ?? "";
    const value = values[i] ?? "";
    if (key === "" && value === "") continue;
    if (key === "") return { metadata: {}, error: "Schlüssel darf nicht leer sein." };
    if (key.length > MAX_KEY)
      return { metadata: {}, error: `Schlüssel "${key.slice(0, 16)}…" überschreitet ${MAX_KEY} Zeichen.` };
    if (value.length > MAX_VALUE)
      return { metadata: {}, error: `Wert für "${key}" überschreitet ${MAX_VALUE} Zeichen.` };
    if (seen.has(key.toLowerCase()))
      return { metadata: {}, error: `Schlüssel "${key}" ist mehrfach vergeben.` };
    seen.add(key.toLowerCase());
    metadata[key] = value;
    count++;
    if (count > MAX_METADATA_ENTRIES)
      return { metadata: {}, error: `Maximal ${MAX_METADATA_ENTRIES} Zusatz-Attribute erlaubt.` };
  }

  return { metadata };
}

export function parseItemInput(formData: FormData): ItemValidationResult {
  const fieldErrors: ItemValidationResult["fieldErrors"] = {};

  const rawCategory = sanitize(formData.get("category"));
  const brand = sanitize(formData.get("brand"));
  const model = sanitize(formData.get("model"));
  const rawWeight = sanitize(formData.get("weight_g"));
  const rawUnit = sanitize(formData.get("weight_unit"));
  const isPublic = formData.get("is_public") === "on";

  let category: ItemCategory | null = null;
  if (!isItemCategory(rawCategory)) {
    fieldErrors.category = "Bitte eine Kategorie auswählen.";
  } else {
    category = rawCategory;
  }

  if (brand.length === 0) {
    fieldErrors.brand = "Marke ist ein Pflichtfeld.";
  } else if (brand.length > MAX_BRAND) {
    fieldErrors.brand = `Höchstens ${MAX_BRAND} Zeichen.`;
  }

  if (model.length === 0) {
    fieldErrors.model = "Modell ist ein Pflichtfeld.";
  } else if (model.length > MAX_MODEL) {
    fieldErrors.model = `Höchstens ${MAX_MODEL} Zeichen.`;
  }

  const inputUnit: "g" | "kg" = rawUnit === "kg" ? "kg" : "g";
  let weight_g: number | null = null;
  if (rawWeight !== "") {
    const grams = parseToGrams(rawWeight, inputUnit);
    if (grams === null || grams <= 0) {
      fieldErrors.weight_g =
        inputUnit === "kg"
          ? "Gewicht muss eine positive Zahl in kg sein."
          : "Gewicht muss eine positive Zahl in Gramm sein.";
    } else if (grams > 1_000_000) {
      fieldErrors.weight_g = "Gewicht ist unrealistisch hoch.";
    } else {
      weight_g = grams;
    }
  }

  const meta = parseMetadata(formData);
  if (meta.error) {
    fieldErrors.metadata = meta.error;
  }

  let parent_id: string | null = null;
  if (category !== null && CATEGORIES_WITH_PARENT.includes(category)) {
    const rawParent = sanitize(formData.get("parent_id"));
    if (rawParent !== "" && rawParent !== "none") {
      if (!UUID_RE.test(rawParent)) {
        fieldErrors.parent_id = "Ungültige Bike-Referenz.";
      } else {
        parent_id = rawParent;
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0 || category === null) {
    return { data: null, fieldErrors };
  }

  return {
    data: { category, brand, model, weight_g, is_public: isPublic, metadata: meta.metadata, parent_id },
    fieldErrors: {},
  };
}
