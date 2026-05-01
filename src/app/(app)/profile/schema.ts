import { z } from "zod";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_AVATAR_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .max(120, "Höchstens 120 Zeichen erlaubt.")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  bio: z
    .string()
    .max(500, "Höchstens 500 Zeichen erlaubt.")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  is_public: z.boolean().default(false),
  weight_unit: z.enum(["g", "kg"], {
    error: () => ({ message: "Ungültige Gewichtseinheit. Erlaubt: g oder kg." }),
  }),
  // Avatar is validated separately in the action (File objects cannot travel through Zod cleanly
  // when parsed from FormData in all environments), but the shape is documented here.
  avatar: z
    .instanceof(File)
    .optional()
    .superRefine((file, ctx) => {
      if (!file || file.size === 0) return;
      if (file.size > MAX_AVATAR_BYTES) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bild ist größer als 5 MB.",
        });
      }
      if (!ALLOWED_AVATAR_MIME.has(file.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nur JPEG, PNG, WebP oder AVIF erlaubt.",
        });
      }
    }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface ProfileFormState {
  /** Top-level, non-field error message shown to the user. */
  error?: string;
  /** Per-field validation error messages (keys match UpdateProfileInput). */
  fieldErrors?: {
    full_name?: string;
    bio?: string;
    is_public?: string;
    weight_unit?: string;
    avatar?: string;
  };
  /** Success message to display after a successful update. */
  success?: string;
}
