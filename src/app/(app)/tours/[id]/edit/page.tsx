import { TourForm } from "@/components/tours/TourForm";
import { updateTourAction } from "@/app/(app)/tours/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

interface EditTourPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTourPage({ params }: EditTourPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tour } = await supabase
    .from("tours")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!tour) notFound();

  // Only the owner may edit.
  if (!user || user.id !== tour.user_id) redirect(`/tours/${id}`);

  const boundAction = updateTourAction.bind(null, id);
  const allPresets = await fetchPresetGroups(supabase, user.id);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">Tour bearbeiten</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="text-petrol-400">{tour.name}</span> bearbeiten
        </h1>
      </div>

      <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-5 shadow-cockpit">
        <TourForm action={boundAction} initialData={tour} submitLabel="Änderungen speichern" allPresets={allPresets} />
      </div>
    </div>
  );
}

async function fetchPresetGroups(supabase: SupabaseClient, userId: string) {
  const { data: rawPresets } = await supabase
    .from("bike_presets")
    .select("id, name, bike_id, items(brand, model)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (!rawPresets) return [];

  const byBike = new Map<string, { bikeLabel: string; bikeId: string; presets: { id: string; name: string }[] }>();
  for (const p of rawPresets) {
    const bike = p.items as unknown as { brand: string; model: string | null } | null;
    const bikeLabel = bike ? `${bike.brand}${bike.model ? ` ${bike.model}` : ""}` : "Unbekannt";
    if (!byBike.has(p.bike_id)) {
      byBike.set(p.bike_id, { bikeId: p.bike_id, bikeLabel, presets: [] });
    }
    byBike.get(p.bike_id)!.presets.push({ id: p.id, name: p.name });
  }

  return Array.from(byBike.values());
}
