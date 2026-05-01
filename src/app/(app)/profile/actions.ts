"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateProfileSchema, type ProfileFormState } from "./schema";

const BUCKET = "avatars";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return { supabase, user };
}

async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  if (file.size === 0) return { error: "EMPTY" };
  if (file.size > MAX_AVATAR_BYTES) return { error: "Bild ist größer als 5 MB." };
  if (!ALLOWED_MIME.has(file.type)) return { error: "Nur JPEG, PNG, WebP oder AVIF erlaubt." };

  const ext =
    { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[
      file.type
    ] ?? "jpg";

  // Fixed path per user — upsert=true replaces the existing avatar on every upload.
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: true,
  });
  if (error) return { error: "Avatar-Upload fehlgeschlagen." };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

// ---------------------------------------------------------------------------
// Server Action: updateProfileAction
// ---------------------------------------------------------------------------

/**
 * Updates the authenticated user's own profile.
 *
 * FormData keys:
 *   full_name   — optional string, max 120 chars
 *   bio         — optional string, max 500 chars
 *   is_public   — "on" | (absent) — checkbox convention
 *   weight_unit — "g" | "kg"
 *   avatar      — optional File (JPEG / PNG / WebP / AVIF, max 5 MB)
 *
 * Upload order: storage first → DB update second.
 * If storage upload fails, the profile row is NOT modified.
 */
export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  // ------------------------------------------------------------------
  // 1. Parse and validate text fields
  // ------------------------------------------------------------------
  const raw = {
    full_name: String(formData.get("full_name") ?? "").trim() || undefined,
    bio: String(formData.get("bio") ?? "").trim() || undefined,
    is_public: formData.get("is_public") === "on",
    weight_unit: String(formData.get("weight_unit") ?? "g"),
  };

  const parsed = updateProfileSchema.omit({ avatar: true }).safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: ProfileFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof NonNullable<ProfileFormState["fieldErrors"]>;
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors };
  }

  // ------------------------------------------------------------------
  // 2. Verify authentication (first line of defence — RLS is second)
  // ------------------------------------------------------------------
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  // ------------------------------------------------------------------
  // 3. Avatar upload (BEFORE DB update — no partial state on failure)
  // ------------------------------------------------------------------
  let nextAvatarUrl: string | undefined;
  const avatarFile = formData.get("avatar");

  if (avatarFile instanceof File && avatarFile.size > 0) {
    const result = await uploadAvatar(supabase, user.id, avatarFile);
    if ("error" in result) {
      if (result.error !== "EMPTY") {
        return { fieldErrors: { avatar: result.error } };
      }
    } else {
      nextAvatarUrl = result.url;
    }
  }

  // ------------------------------------------------------------------
  // 4. Build update payload
  // ------------------------------------------------------------------
  const updatePayload: {
    full_name: string | null;
    bio: string | null;
    is_public: boolean;
    weight_unit: string;
    avatar_url?: string;
  } = {
    full_name: parsed.data.full_name ?? null,
    bio: parsed.data.bio ?? null,
    is_public: parsed.data.is_public,
    weight_unit: parsed.data.weight_unit,
  };

  if (nextAvatarUrl !== undefined) {
    updatePayload.avatar_url = nextAvatarUrl;
  }

  // ------------------------------------------------------------------
  // 5. Persist to profiles table — RLS enforces auth.uid() = id
  // ------------------------------------------------------------------
  const { error: dbError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (dbError) {
    return { error: "Profil konnte nicht gespeichert werden. Bitte erneut versuchen." };
  }

  // ------------------------------------------------------------------
  // 6. Invalidate both the own page and the public profile page
  // ------------------------------------------------------------------
  revalidatePath("/profile");

  // Fetch username to revalidate the public URL as well.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (profileRow?.username) {
    revalidatePath(`/profile/${profileRow.username}`);
  }

  return { success: "Profil erfolgreich gespeichert." };
}
