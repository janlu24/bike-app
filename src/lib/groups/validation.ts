import type { ItemCategory } from "@/types/supabase";
import { isItemCategory } from "@/lib/items/categories";

export interface GroupInput {
  category: ItemCategory;
  name: string;
  property_keys: string[];
}

export type GroupFieldError = "category" | "name" | "property_keys";

export interface GroupValidationResult {
  data: GroupInput | null;
  fieldErrors: Partial<Record<GroupFieldError, string>>;
}

export type KeyDecision = "delete" | "keep";

export interface PropagationDecisions {
  removedKeysDecision: Record<string, KeyDecision>;
}

const MAX_NAME = 80;
const MAX_KEY = 40;
const MAX_KEYS = 25;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitize(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseGroupInput(formData: FormData): GroupValidationResult {
  const fieldErrors: GroupValidationResult["fieldErrors"] = {};

  const rawCategory = sanitize(formData.get("category"));
  const name = sanitize(formData.get("name"));
  const rawKeys = formData.getAll("property_key").map((v) => sanitize(v));

  let category: ItemCategory | null = null;
  if (!isItemCategory(rawCategory)) {
    fieldErrors.category = "Bitte eine Kategorie auswählen.";
  } else {
    category = rawCategory;
  }

  if (name.length === 0) {
    fieldErrors.name = "Name ist ein Pflichtfeld.";
  } else if (name.length > MAX_NAME) {
    fieldErrors.name = `Höchstens ${MAX_NAME} Zeichen.`;
  }

  const property_keys = rawKeys.filter((k) => k !== "");

  if (property_keys.length === 0) {
    fieldErrors.property_keys = "Mindestens ein Eigenschaftsschlüssel ist erforderlich.";
  } else if (property_keys.length > MAX_KEYS) {
    fieldErrors.property_keys = `Maximal ${MAX_KEYS} Schlüssel erlaubt.`;
  } else {
    const seen = new Set<string>();
    for (const key of property_keys) {
      if (key.length > MAX_KEY) {
        fieldErrors.property_keys = `Schlüssel "${key.slice(0, 16)}…" überschreitet ${MAX_KEY} Zeichen.`;
        break;
      }
      if (seen.has(key.toLowerCase())) {
        fieldErrors.property_keys = `Schlüssel "${key}" ist mehrfach vergeben.`;
        break;
      }
      seen.add(key.toLowerCase());
    }
  }

  if (Object.keys(fieldErrors).length > 0 || category === null) {
    return { data: null, fieldErrors };
  }

  return { data: { category, name, property_keys }, fieldErrors: {} };
}

export function parsePropagationDecisions(formData: FormData): PropagationDecisions {
  const removedKeysDecision: Record<string, KeyDecision> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("removed_key_decision[") && k.endsWith("]")) {
      const key = k.slice("removed_key_decision[".length, -1);
      if (key && (v === "delete" || v === "keep")) {
        removedKeysDecision[key] = v;
      }
    }
  }
  return { removedKeysDecision };
}

export function isValidGroupId(value: string): boolean {
  return UUID_RE.test(value);
}

export function computeGroupDiff(
  oldKeys: string[],
  newKeys: string[]
): { added: string[]; removed: string[] } {
  const oldSet = new Set(oldKeys);
  const newSet = new Set(newKeys);
  const added = newKeys.filter((k) => !oldSet.has(k));
  const removed = oldKeys.filter((k) => !newSet.has(k));
  return { added, removed };
}
