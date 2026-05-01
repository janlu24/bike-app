import type { TemplateValidationResult } from "@/lib/templates/validation";

export type TemplateFormState = TemplateValidationResult & { error?: string };
