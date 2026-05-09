import type { GroupValidationResult } from "@/lib/groups/validation";

export type GroupFormState = GroupValidationResult & { error?: string };
