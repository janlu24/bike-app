import { z } from "zod";

export const createPresetSchema = z.object({
  bikeId: z.string().uuid("Ungültige Bike-ID."),
  name: z
    .string()
    .min(1, "Name ist ein Pflichtfeld.")
    .max(50, "Name darf maximal 50 Zeichen lang sein."),
  description: z
    .string()
    .max(200, "Beschreibung darf maximal 200 Zeichen lang sein.")
    .nullable()
    .optional(),
});

export const renamePresetSchema = z.object({
  presetId: z.string().uuid("Ungültige Preset-ID."),
  name: z
    .string()
    .min(1, "Name ist ein Pflichtfeld.")
    .max(50, "Name darf maximal 50 Zeichen lang sein."),
});

export const presetIdSchema = z.object({
  presetId: z.string().uuid("Ungültige Preset-ID."),
});

export const applyPresetSchema = z.object({
  presetId: z.string().uuid("Ungültige Preset-ID."),
});

export const presetItemSchema = z.object({
  presetId: z.string().uuid("Ungültige Preset-ID."),
  itemId: z.string().uuid("Ungültige Item-ID."),
});
