import { TourForm } from "@/components/tours/TourForm";
import { createTourAction } from "@/app/(app)/tours/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Neue Tour · Setup Registry",
};

export default async function NewTourPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allPresets = await fetchPresetGroups(supabase, user?.id ?? null);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">Neue Tour</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tour <span className="text-petrol-400">anlegen</span>
        </h1>
        <p className="mt-1 text-sm text-cockpit-muted">
          Pflicht: Name. Alles andere optional – füge Daten vor oder nach der Tour ein.
        </p>
      </div>

      <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-5 shadow-cockpit">
        <TourForm action={createTourAction} submitLabel="Tour anlegen" allPresets={allPresets} />
      </div>
    </div>
  );
}

async function fetchPresetGroups(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string | null
) {
  if (!userId) return [];

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
