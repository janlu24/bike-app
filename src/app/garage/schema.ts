import type { ItemValidationResult } from "@/lib/items/validation";

export type ItemFormState = ItemValidationResult & { error?: string };
