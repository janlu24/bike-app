import { TourCard } from "@/components/tours/TourCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TourRow } from "@/types/supabase";
import { Map, Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Touren · Setup Registry",
};

export default async function ToursPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tours: TourRow[] = user
    ? ((
        await supabase
          .from("tours")
          .select("*")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
      ).data ?? [])
    : [];

  // Load item counts per tour in one query.
  const tourIds = tours.map((t) => t.id);
  const itemCountMap: Record<string, number> = {};
  if (tourIds.length > 0) {
    const { data: counts } = await supabase
      .from("tour_items")
      .select("tour_id")
      .in("tour_id", tourIds);
    for (const row of counts ?? []) {
      itemCountMap[row.tour_id] = (itemCountMap[row.tour_id] ?? 0) + 1;
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">Touren</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Deine <span className="text-petrol-400">Touren</span>
          </h1>
          <p className="mt-1 text-sm text-cockpit-muted">
            {tours.length} Tour{tours.length !== 1 ? "en" : ""} gesamt
          </p>
        </div>
        <Link
          href="/tours/new"
          className="inline-flex items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-3.5 py-2 text-sm font-medium text-white shadow-cockpit transition-colors hover:bg-petrol-500"
        >
          <Plus size={16} strokeWidth={2} aria-hidden />
          Neue Tour
        </Link>
      </header>

      {tours.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-cockpit-border py-16 text-center">
          <Map size={32} strokeWidth={1.5} className="mb-3 text-petrol-700" aria-hidden />
          <p className="text-sm font-medium text-cockpit-text">Noch keine Touren</p>
          <p className="mt-1 text-xs text-cockpit-muted">
            Lege deine erste Tour an und erstelle eine Packliste.
          </p>
          <Link
            href="/tours/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-petrol-500"
          >
            <Plus size={15} strokeWidth={2} aria-hidden />
            Erste Tour anlegen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <TourCard
              key={tour.id}
              tour={tour}
              itemCount={itemCountMap[tour.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
