import { z } from "zod";

export const createProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Mindestens 3 Zeichen erforderlich.")
    .max(32, "Höchstens 32 Zeichen erlaubt.")
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
      "Nur Buchstaben, Ziffern, '-' oder '_'. Muss mit einem Buchstaben oder einer Ziffer beginnen und enden."
    ),
  full_name: z.string().max(80, "Höchstens 80 Zeichen erlaubt.").optional(),
  is_public: z.boolean().default(false),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;

export interface OnboardingFormState {
  error?: string;
  fieldErrors?: {
    username?: string;
    full_name?: string;
  };
}
