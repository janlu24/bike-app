"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseItemInput } from "@/lib/items/validation";
import { isValidGroupId } from "@/lib/groups/validation";
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

  const { error } = await supabase.from("items").insert({
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
  });

  if (error) {
    if (image_url) await tryDeleteImage(supabase, user.id, image_url);
    return { ...empty, error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }

  revalidatePath("/", "layout");
  redirect("/garage");
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
  revalidatePath(`/garage/${itemId}/edit`);
  redirect("/garage");
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
