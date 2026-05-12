"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseTourInput, isValidTourId } from "@/lib/tours/validation";
import type { TourFormState } from "./schema";

const empty: TourFormState = { data: null, fieldErrors: {} };

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return { supabase, user };
}

// ---------------------------------------------------------------------------
// Tour CRUD
// ---------------------------------------------------------------------------

export async function createTourAction(
  _prev: TourFormState,
  formData: FormData
): Promise<TourFormState> {
  const parsed = parseTourInput(formData);
  if (!parsed.data) return parsed;

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { ...empty, error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { data: tour, error } = await supabase
    .from("tours")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      start_location: parsed.data.start_location,
      destination: parsed.data.destination,
      status: parsed.data.status,
      planned_distance_km: parsed.data.planned_distance_km,
      planned_elevation_up_m: parsed.data.planned_elevation_up_m,
      planned_elevation_down_m: parsed.data.planned_elevation_down_m,
      actual_distance_km: parsed.data.actual_distance_km,
      actual_elevation_up_m: parsed.data.actual_elevation_up_m,
      actual_elevation_down_m: parsed.data.actual_elevation_down_m,
      duration_hours: parsed.data.duration_hours,
      duration_minutes: parsed.data.duration_minutes,
      is_public: parsed.data.is_public,
    })
    .select("id")
    .single();

  if (error || !tour) {
    return { ...empty, error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }

  revalidatePath("/tours");
  redirect(`/tours/${tour.id}`);
}

export async function updateTourAction(
  tourId: string,
  _prev: TourFormState,
  formData: FormData
): Promise<TourFormState> {
  if (!isValidTourId(tourId)) {
    return { ...empty, error: "Ungültige Tour-ID." };
  }

  const parsed = parseTourInput(formData);
  if (!parsed.data) return parsed;

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { ...empty, error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { error } = await supabase
    .from("tours")
    .update({
      name: parsed.data.name,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      start_location: parsed.data.start_location,
      destination: parsed.data.destination,
      status: parsed.data.status,
      planned_distance_km: parsed.data.planned_distance_km,
      planned_elevation_up_m: parsed.data.planned_elevation_up_m,
      planned_elevation_down_m: parsed.data.planned_elevation_down_m,
      actual_distance_km: parsed.data.actual_distance_km,
      actual_elevation_up_m: parsed.data.actual_elevation_up_m,
      actual_elevation_down_m: parsed.data.actual_elevation_down_m,
      duration_hours: parsed.data.duration_hours,
      duration_minutes: parsed.data.duration_minutes,
      is_public: parsed.data.is_public,
    })
    .eq("id", tourId)
    .eq("user_id", user.id);

  if (error) {
    return { ...empty, error: "Update fehlgeschlagen. Bitte erneut versuchen." };
  }

  revalidatePath("/tours");
  revalidatePath(`/tours/${tourId}`);
  redirect(`/tours/${tourId}`);
}

export async function deleteTourAction(id: string): Promise<{ error?: string }> {
  if (!isValidTourId(id)) {
    return { error: "Ungültige Tour-ID." };
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  // Verify ownership before deleting (defense in depth on top of RLS).
  const { data: tour } = await supabase
    .from("tours")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tour) return { error: "Tour nicht gefunden." };

  const { error } = await supabase
    .from("tours")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[deleteTourAction] Supabase error:", error);
    return { error: "Löschen fehlgeschlagen. Bitte erneut versuchen." };
  }

  revalidatePath("/tours");
  revalidatePath(`/tours/${id}`);
  return {};
}

// ---------------------------------------------------------------------------
// Packlist mutations
// ---------------------------------------------------------------------------

export async function addTourItemAction(tourId: string, itemId: string): Promise<{ error?: string }> {
  if (!isValidTourId(tourId) || !isValidTourId(itemId)) {
    return { error: "Ungültige ID." };
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  // Verify tour ownership (defense in depth on top of RLS).
  const { data: tour } = await supabase
    .from("tours")
    .select("id")
    .eq("id", tourId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tour) return { error: "Tour nicht gefunden." };

  const { error } = await supabase
    .from("tour_items")
    .insert({ tour_id: tourId, item_id: itemId });

  if (error) {
    if (error.code === "23505") return { error: "Item ist bereits auf der Packliste." };
    return { error: "Hinzufügen fehlgeschlagen." };
  }

  revalidatePath(`/tours/${tourId}`);
  return {};
}

export async function removeTourItemAction(tourId: string, itemId: string): Promise<{ error?: string }> {
  if (!isValidTourId(tourId) || !isValidTourId(itemId)) {
    return { error: "Ungültige ID." };
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  // Verify tour ownership before deleting (defense in depth on top of RLS).
  const { data: tour } = await supabase
    .from("tours")
    .select("id")
    .eq("id", tourId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tour) return { error: "Tour nicht gefunden." };

  const { error } = await supabase
    .from("tour_items")
    .delete()
    .eq("tour_id", tourId)
    .eq("item_id", itemId);

  if (error) {
    return { error: "Entfernen fehlgeschlagen." };
  }

  revalidatePath(`/tours/${tourId}`);
  return {};
}

// ---------------------------------------------------------------------------
// Feedback mutations (rating + note on tour_items)
// ---------------------------------------------------------------------------

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5).nullable(),
  note: z.string().max(1000).nullable(),
}).refine((d) => d.rating !== null || (d.note !== null && d.note.trim().length > 0), {
  message: "Mindestens Bewertung oder Notiz muss angegeben werden.",
});

export async function upsertFeedbackAction(
  tourId: string,
  itemId: string,
  rating: number | null,
  note: string | null,
): Promise<{ error?: string }> {
  if (!isValidTourId(tourId) || !isValidTourId(itemId)) {
    return { error: "Ungültige ID." };
  }

  const parsed = feedbackSchema.safeParse({ rating, note: note?.trim() || null });
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

  // Verify tour ownership (defense in depth on top of RLS).
  const { data: tour } = await supabase
    .from("tours")
    .select("id")
    .eq("id", tourId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tour) return { error: "Tour nicht gefunden." };

  // Use upsert so child items (auto-included via parent_id) get a tour_items
  // row created on first feedback — tour owner check above + RLS enforce access.
  const { error } = await supabase
    .from("tour_items")
    .upsert(
      { tour_id: tourId, item_id: itemId, rating: parsed.data.rating, note: parsed.data.note },
      { onConflict: "tour_id,item_id" },
    );

  if (error) {
    return { error: "Feedback speichern fehlgeschlagen." };
  }

  revalidatePath(`/tours/${tourId}`);
  return {};
}

export async function deleteFeedbackAction(
  tourId: string,
  itemId: string,
): Promise<{ error?: string }> {
  if (!isValidTourId(tourId) || !isValidTourId(itemId)) {
    return { error: "Ungültige ID." };
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  // Verify tour ownership (defense in depth on top of RLS).
  const { data: tour } = await supabase
    .from("tours")
    .select("id")
    .eq("id", tourId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tour) return { error: "Tour nicht gefunden." };

  const { error } = await supabase
    .from("tour_items")
    .update({ rating: null, note: null })
    .eq("tour_id", tourId)
    .eq("item_id", itemId);

  if (error) {
    return { error: "Feedback löschen fehlgeschlagen." };
  }

  revalidatePath(`/tours/${tourId}`);
  return {};
}
