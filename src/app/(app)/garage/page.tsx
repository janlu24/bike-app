import { BikeSelector } from "@/components/items/BikeSelector";
import { BuildView } from "@/components/items/BuildView";
import { ItemCard } from "@/components/items/ItemCard";
import { computeBuild } from "@/lib/items/build";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BikeOption, BikePresetWithItems, ItemRow } from "@/types/supabase";
import { Bike, Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface GaragePageProps {
  searchParams: Promise<{ bikeId?: string }>;
}

export default async function GaragePage({ searchParams }: GaragePageProps) {
  const { bikeId } = await searchParams;
  const requestedBikeId =
    typeof bikeId === "string" && bikeId.length > 0 ? bikeId : null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let bikes: ItemRow[] = [];
  let allItems: ItemRow[] = [];

  if (user) {
    if (requestedBikeId !== null) {
      // Build mode: need all items to compute build + available parts
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      allItems = (data ?? []) as ItemRow[];
      bikes = allItems.filter((i) => i.category === "Bike");
    } else {
      // List mode: only bikes needed
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .eq("category", "Bike")
        .order("created_at", { ascending: false });
      bikes = (data ?? []) as ItemRow[];
      allItems = bikes;
    }
  }

  const bikeOptions: BikeOption[] = bikes.map((b) => ({
    id: b.id,
    brand: b.brand,
    model: b.model,
  }));

  const activeBike =
    requestedBikeId !== null
      ? (bikes.find((i) => i.id === requestedBikeId) ?? null)
      : null;
  const buildMode = activeBike !== null;

  let initialPresets: BikePresetWithItems[] = [];
  if (buildMode && user) {
    const { data: presetsData } = await supabase
      .from("bike_presets")
      .select("*, preset_items(item_id)")
      .eq("bike_id", activeBike!.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    initialPresets = (presetsData ?? []) as BikePresetWithItems[];
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
            Werkstatt
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Deine <span className="text-petrol-400">Garage</span>
          </h1>
          <p className="mt-1 text-sm text-cockpit-muted">
            {buildMode
              ? `Build-Fokus · ${activeBike!.brand}${activeBike!.model ? ` ${activeBike!.model}` : ""}`
              : `${bikes.length} Bike${bikes.length === 1 ? "" : "s"} erfasst`}
          </p>
        </div>

        <Link
          href="/inventory/new"
          className="inline-flex items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-3.5 py-2 text-sm font-medium text-white shadow-cockpit transition-colors hover:bg-petrol-500"
        >
          <Plus size={16} strokeWidth={2} aria-hidden />
          Neues Bike
        </Link>
      </header>

      <BikeSelector bikes={bikeOptions} activeBikeId={buildMode ? activeBike!.id : null} />

      {buildMode ? (
        <BuildView
          key={activeBike!.id}
          build={computeBuild(activeBike!, allItems)}
          availableParts={allItems.filter(
            (i) => i.category !== "Bike" && i.parent_id === null
          )}
          initialPresets={initialPresets}
        />
      ) : bikes.length === 0 ? (
        <BikeEmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bikes.map((bike) => (
            <ItemCard key={bike.id} item={bike} parent={null} />
          ))}
        </div>
      )}
    </div>
  );
}

function BikeEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-petrol-800/60 bg-cockpit-surface/60 p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-petrol-700/50 bg-petrol-950/40 text-petrol-300">
        <Bike size={26} strokeWidth={1.5} aria-hidden />
      </div>
      <p className="text-[11px] uppercase tracking-widest text-petrol-300">
        Garage leer
      </p>
      <h2 className="mt-1 text-base font-semibold text-cockpit-text">
        Noch kein Bike erfasst.
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-cockpit-muted">
        Füge dein erstes Bike hinzu, um den Build-Fokus und den Preset-Manager zu nutzen.
      </p>
      <Link
        href="/inventory/new"
        className="mt-5 inline-flex items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-3.5 py-2 text-sm font-medium text-white shadow-cockpit transition-colors hover:bg-petrol-500"
      >
        <Plus size={16} strokeWidth={2} aria-hidden />
        Erstes Bike anlegen
      </Link>
    </div>
  );
}
