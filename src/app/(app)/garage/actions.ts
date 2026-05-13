"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseItemInput } from "@/lib/items/validation";
import { isValidGroupId } from "@/lib/groups/validation";
import {
  createPresetSchema,
  renamePresetSchema,
  presetIdSchema,
  applyPresetSchema,
  presetItemSchema,
} from "@/lib/items/preset-validation";
import type { BikePresetRow, ItemRow } from "@/types/supabase";
import type { ItemFormState } from "./schema";

const empty: ItemFormState = { data: null, fieldErrors: {} };

const BUCKET = "item-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return { supabase, user };
}

async function uploadItemImage(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  if (file.size === 0) return { error: "EMPTY" };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Bild ist größer als 5 MB." };
  if (!ALLOWED_MIME.has(file.type)) return { error: "Nur JPEG, PNG, WebP oder AVIF erlaubt." };

  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[file.type] ?? "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return { error: "Upload fehlgeschlagen." };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

async function tryDeleteImage(
  supabase: SupabaseClient,
  userId: string,
  imageUrl: string | null
): Promise<void> {
  if (!imageUrl) return;
  const marker = `/object/public/${BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return;
  const path = imageUrl.slice(idx + marker.length);
  if (!path.startsWith(`${userId}/`)) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function createItemAction(
  _prev: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const parsed = parseItemInput(formData);
  if (!parsed.data) return parsed;

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { ...empty, error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  let image_url: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const upload = await uploadItemImage(supabase, user.id, file);
    if ("error" in upload) {
      if (upload.error !== "EMPTY") return { ...empty, error: upload.error };
    } else {
      image_url = upload.url;
    }
  }

  // Resolve optional group_id — verify it belongs to this user.
  let group_id: string | null = null;
  const rawGroupId = typeof formData.get("group_id") === "string"
    ? (formData.get("group_id") as string).trim()
    : "";
  if (rawGroupId && isValidGroupId(rawGroupId)) {
    const { data: grp } = await supabase
      .from("item_groups")
      .select("id")
      .eq("id", rawGroupId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (grp) group_id = grp.id;
  }

  const { data: newItem, error } = await supabase
    .from("items")
    .insert({
      user_id: user.id,
      category: parsed.data.category,
      brand: parsed.data.brand,
      model: parsed.data.model,
      weight_g: parsed.data.weight_g,
      is_public: parsed.data.is_public,
      metadata: parsed.data.metadata,
      image_url,
      parent_id: parsed.data.parent_id,
      group_id,
    })
    .select("id")
    .single();

  if (error || !newItem) {
    if (image_url) await tryDeleteImage(supabase, user.id, image_url);
    return { ...empty, error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }

  revalidatePath("/", "layout");

  // Context-aware redirect: group-compare takes priority; otherwise go to the item's view page.
  // We use the already-verified group_id (not the raw form value) to prevent open redirects.
  const rawRedirectGroupId = String(formData.get("redirect_group_id") ?? "").trim();
  const destination =
    group_id && rawRedirectGroupId === group_id
      ? `/garage/groups/${group_id}/compare`
      : `/garage/${newItem.id}`;
  redirect(destination);
}

export async function updateItemAction(
  itemId: string,
  _prev: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const parsed = parseItemInput(formData);
  if (!parsed.data) return parsed;

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { ...empty, error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  // Load existing image_url to enable rollback/cleanup.
  const { data: existing } = await supabase
    .from("items")
    .select("image_url")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .maybeSingle();

  let nextImageUrl: string | null | undefined = undefined;
  const file = formData.get("image");
  const removeFlag = formData.get("remove_image") === "on";

  if (file instanceof File && file.size > 0) {
    const upload = await uploadItemImage(supabase, user.id, file);
    if ("error" in upload) {
      if (upload.error !== "EMPTY") return { ...empty, error: upload.error };
    } else {
      nextImageUrl = upload.url;
    }
  } else if (removeFlag) {
    nextImageUrl = null;
  }

  const basePayload = {
    category: parsed.data.category,
    brand: parsed.data.brand,
    model: parsed.data.model,
    weight_g: parsed.data.weight_g,
    is_public: parsed.data.is_public,
    metadata: parsed.data.metadata,
    parent_id: parsed.data.parent_id,
  };
  const updatePayload =
    nextImageUrl !== undefined ? { ...basePayload, image_url: nextImageUrl } : basePayload;

  const { error } = await supabase
    .from("items")
    .update(updatePayload)
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) {
    if (nextImageUrl) await tryDeleteImage(supabase, user.id, nextImageUrl);
    return { ...empty, error: "Update fehlgeschlagen. Bitte erneut versuchen." };
  }

  if (nextImageUrl !== undefined && existing?.image_url) {
    await tryDeleteImage(supabase, user.id, existing.image_url as string);
  }

  revalidatePath("/", "layout");
  revalidatePath(`/garage/${itemId}`);
  redirect(`/garage/${itemId}`);
}

export async function deleteItemAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    revalidatePath("/", "layout");
    redirect("/garage");
  }

  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("items")
    .select("image_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  await supabase.from("items").delete().eq("id", id).eq("user_id", user.id);

  if (existing?.image_url) {
    await tryDeleteImage(supabase, user.id, existing.image_url as string);
  }

  revalidatePath("/", "layout");
  redirect("/garage");
}

const generalNoteSchema = z.object({
  itemId: z.string().uuid(),
  note: z
    .string()
    .max(2000, "Kommentar darf maximal 2000 Zeichen lang sein.")
    .transform((v) => (v.trim() === "" ? null : v.trim()))
    .nullable(),
});

export type GeneralNoteResult = { ok: true } | { error: string };

export async function updateGeneralNoteAction(
  itemId: string,
  rawNote: string | null
): Promise<GeneralNoteResult> {
  const parsed = generalNoteSchema.safeParse({ itemId, note: rawNote ?? "" });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { error } = await supabase
    .from("items")
    .update({ general_note: parsed.data.note })
    .eq("id", parsed.data.itemId)
    .eq("user_id", user.id);

  if (error) return { error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };

  revalidatePath(`/garage/${parsed.data.itemId}`);
  return { ok: true };
}

// ─── PROJ-14: Bike Versioning System ────────────────────────────────────────

const linkSchema = z.object({
  bikeId: z.string().uuid(),
  itemId: z.string().uuid(),
});

export type LinkResult = { ok: true } | { error: string };

export async function linkComponentToBikeAction(
  bikeId: string,
  itemId: string
): Promise<LinkResult> {
  const parsed = linkSchema.safeParse({ bikeId, itemId });
  if (!parsed.success) return { error: "Ungültige IDs." };

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  // Verify bike belongs to user and is actually a Bike
  const { data: bike } = await supabase
    .from("items")
    .select("id")
    .eq("id", parsed.data.bikeId)
    .eq("user_id", user.id)
    .eq("category", "Bike")
    .maybeSingle();
  if (!bike) return { error: "Bike nicht gefunden." };

  // Verify component belongs to user and is not a Bike
  const { data: component } = await supabase
    .from("items")
    .select("id")
    .eq("id", parsed.data.itemId)
    .eq("user_id", user.id)
    .neq("category", "Bike")
    .maybeSingle();
  if (!component) return { error: "Komponente nicht gefunden." };

  const { error } = await supabase
    .from("items")
    .update({ parent_id: parsed.data.bikeId })
    .eq("id", parsed.data.itemId)
    .eq("user_id", user.id);

  if (error) return { error: "Zuordnung fehlgeschlagen." };

  revalidatePath("/garage");
  return { ok: true };
}

const unlinkSchema = z.object({ itemId: z.string().uuid() });

export async function unlinkComponentFromBikeAction(
  itemId: string
): Promise<LinkResult> {
  const parsed = unlinkSchema.safeParse({ itemId });
  if (!parsed.success) return { error: "Ungültige ID." };

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { error } = await supabase
    .from("items")
    .update({ parent_id: null })
    .eq("id", parsed.data.itemId)
    .eq("user_id", user.id)
    .neq("category", "Bike");

  if (error) return { error: "Lösen fehlgeschlagen." };

  revalidatePath("/garage");
  return { ok: true };
}

// ─── PROJ-15: Bike Preset Manager ───────────────────────────────────────────

export type PresetResult = { ok: true; preset: BikePresetRow } | { error: string };
export type PresetOpResult = { ok: true } | { error: string };
export type DeletePresetResult =
  | { ok: true }
  | { blocked: true; tourNames: string[] }
  | { error: string };

export interface PresetApplyDiff {
  toUnlink: ItemRow[];
  toLink: ItemRow[];
  conflicts: ItemRow[];
}
export type PreviewPresetResult = { ok: true; diff: PresetApplyDiff } | { error: string };

export async function createPresetAction(
  bikeId: string,
  name: string,
  description?: string | null,
  snapshot: boolean = true
): Promise<PresetResult> {
  const parsed = createPresetSchema.safeParse({ bikeId, name, description: description ?? null });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { data: bike } = await supabase
    .from("items")
    .select("id")
    .eq("id", parsed.data.bikeId)
    .eq("user_id", user.id)
    .eq("category", "Bike")
    .maybeSingle();
  if (!bike) return { error: "Bike nicht gefunden." };

  const { data: preset, error: insertErr } = await supabase
    .from("bike_presets")
    .insert({
      user_id: user.id,
      bike_id: parsed.data.bikeId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    .select()
    .single();

  if (insertErr || !preset) return { error: "Preset speichern fehlgeschlagen." };

  if (snapshot) {
    const { data: children } = await supabase
      .from("items")
      .select("id")
      .eq("parent_id", parsed.data.bikeId)
      .eq("user_id", user.id)
      .neq("category", "Bike");

    if (children && children.length > 0) {
      const { error: itemsErr } = await supabase
        .from("preset_items")
        .insert(children.map((c) => ({ preset_id: preset.id, item_id: c.id })));
      if (itemsErr) {
        await supabase.from("bike_presets").delete().eq("id", preset.id);
        return { error: "Preset-Items speichern fehlgeschlagen." };
      }
    }
  }

  revalidatePath("/garage");
  return { ok: true, preset };
}

export type SandboxDataResult =
  | { ok: true; allUserItems: ItemRow[]; currentPresetItemIds: string[] }
  | { error: string };

export async function getPresetSandboxDataAction(presetId: string): Promise<SandboxDataResult> {
  const parsed = presetIdSchema.safeParse({ presetId });
  if (!parsed.success) return { error: "Ungültige ID." };

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { data: preset } = await supabase
    .from("bike_presets")
    .select("id, preset_items(item_id)")
    .eq("id", parsed.data.presetId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!preset) return { error: "Preset nicht gefunden." };

  const currentPresetItemIds = (preset.preset_items as { item_id: string }[]).map((pi) => pi.item_id);

  const { data: allItems } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .neq("category", "Bike")
    .is("deleted_at", null)
    .order("brand", { ascending: true });

  return { ok: true, allUserItems: (allItems ?? []) as ItemRow[], currentPresetItemIds };
}

export async function addItemToPresetAction(
  presetId: string,
  itemId: string
): Promise<PresetOpResult> {
  const parsed = presetItemSchema.safeParse({ presetId, itemId });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { data: preset } = await supabase
    .from("bike_presets")
    .select("id")
    .eq("id", parsed.data.presetId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!preset) return { error: "Preset nicht gefunden." };

  const { data: item } = await supabase
    .from("items")
    .select("id")
    .eq("id", parsed.data.itemId)
    .eq("user_id", user.id)
    .neq("category", "Bike")
    .maybeSingle();
  if (!item) return { error: "Item nicht gefunden." };

  const { error } = await supabase
    .from("preset_items")
    .upsert({ preset_id: parsed.data.presetId, item_id: parsed.data.itemId });
  if (error) return { error: "Hinzufügen fehlgeschlagen." };

  return { ok: true };
}

export async function removeItemFromPresetAction(
  presetId: string,
  itemId: string
): Promise<PresetOpResult> {
  const parsed = presetItemSchema.safeParse({ presetId, itemId });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { data: preset } = await supabase
    .from("bike_presets")
    .select("id")
    .eq("id", parsed.data.presetId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!preset) return { error: "Preset nicht gefunden." };

  const { error } = await supabase
    .from("preset_items")
    .delete()
    .eq("preset_id", parsed.data.presetId)
    .eq("item_id", parsed.data.itemId);
  if (error) return { error: "Entfernen fehlgeschlagen." };

  return { ok: true };
}

export async function renamePresetAction(
  presetId: string,
  name: string
): Promise<PresetOpResult> {
  const parsed = renamePresetSchema.safeParse({ presetId, name });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { error } = await supabase
    .from("bike_presets")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.presetId)
    .eq("user_id", user.id);

  if (error) return { error: "Umbenennen fehlgeschlagen." };

  revalidatePath("/garage");
  return { ok: true };
}

export async function deletePresetAction(presetId: string): Promise<DeletePresetResult> {
  const parsed = presetIdSchema.safeParse({ presetId });
  if (!parsed.success) return { error: "Ungültige ID." };

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { data: preset } = await supabase
    .from("bike_presets")
    .select("id")
    .eq("id", parsed.data.presetId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!preset) return { error: "Preset nicht gefunden." };

  const { data: tours } = await supabase
    .from("tours")
    .select("name")
    .eq("preset_id", parsed.data.presetId)
    .eq("user_id", user.id);

  if (tours && tours.length > 0) {
    return { blocked: true, tourNames: tours.map((t) => t.name) };
  }

  const { error } = await supabase
    .from("bike_presets")
    .delete()
    .eq("id", parsed.data.presetId)
    .eq("user_id", user.id);

  if (error) return { error: "Löschen fehlgeschlagen." };

  revalidatePath("/garage");
  return { ok: true };
}

export async function previewPresetApplyAction(presetId: string): Promise<PreviewPresetResult> {
  const parsed = applyPresetSchema.safeParse({ presetId });
  if (!parsed.success) return { error: "Ungültige ID." };

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { data: preset } = await supabase
    .from("bike_presets")
    .select("id, bike_id, preset_items(item_id)")
    .eq("id", parsed.data.presetId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!preset) return { error: "Preset nicht gefunden." };

  const presetItemIds = (preset.preset_items as { item_id: string }[]).map((pi) => pi.item_id);

  const { data: currentChildren } = await supabase
    .from("items")
    .select("*")
    .eq("parent_id", preset.bike_id)
    .eq("user_id", user.id);

  const currentChildrenIds = new Set((currentChildren ?? []).map((i) => i.id));

  const toUnlink = (currentChildren ?? [])
    .filter((i) => !presetItemIds.includes(i.id))
    .map((i) => i as ItemRow);

  let presetItems: ItemRow[] = [];
  if (presetItemIds.length > 0) {
    const { data: items } = await supabase
      .from("items")
      .select("*")
      .in("id", presetItemIds)
      .eq("user_id", user.id);
    presetItems = (items ?? []) as ItemRow[];
  }

  const toLink = presetItems.filter((i) => !currentChildrenIds.has(i.id));
  const conflicts = presetItems.filter(
    (i) => i.parent_id !== null && i.parent_id !== preset.bike_id
  );

  return { ok: true, diff: { toUnlink, toLink, conflicts } };
}

export async function applyPresetToLiveBikeAction(presetId: string): Promise<PresetOpResult> {
  const parsed = applyPresetSchema.safeParse({ presetId });
  if (!parsed.success) return { error: "Ungültige ID." };

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { data: preset } = await supabase
    .from("bike_presets")
    .select("id, bike_id, preset_items(item_id)")
    .eq("id", parsed.data.presetId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!preset) return { error: "Preset nicht gefunden." };

  const bikeId = preset.bike_id;
  const presetItemIds = (preset.preset_items as { item_id: string }[]).map((pi) => pi.item_id);

  // Step 1: Unlink all current direct children of the bike.
  const { error: unlinkErr } = await supabase
    .from("items")
    .update({ parent_id: null })
    .eq("parent_id", bikeId)
    .eq("user_id", user.id)
    .neq("category", "Bike");

  if (unlinkErr) return { error: "Lösen fehlgeschlagen." };

  // Step 2: Link all preset items to the bike (only items that still exist and belong to user).
  if (presetItemIds.length > 0) {
    const { error: linkErr } = await supabase
      .from("items")
      .update({ parent_id: bikeId })
      .in("id", presetItemIds)
      .eq("user_id", user.id)
      .neq("category", "Bike");

    if (linkErr) return { error: "Zuordnung fehlgeschlagen." };
  }

  revalidatePath("/garage");
  return { ok: true };
}
