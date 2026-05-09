import type { TourValidationResult } from "@/lib/tours/validation";

export type TourFormState = TourValidationResult & { error?: string };
