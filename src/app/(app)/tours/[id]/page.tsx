import { TourStatusBadge } from "@/components/tours/TourStatusBadge";
import { TourStatsGrid } from "@/components/tours/TourStatsGrid";
import { TourPacklist } from "@/components/tours/TourPacklist";
import { TourDeleteButton } from "@/components/tours/TourDeleteButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatTourDate } from "@/lib/tours/utils";
import type { ItemRow, TourRow } from "@/types/supabase";
import { MapPin, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface TourDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TourDetailPage({ params }: TourDetailPageProps) {
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

  const isOwner = user?.id === tour.user_id;

  // Load packlist items with a join, including feedback columns.
  const { data: tourItems } = await supabase
    .from("tour_items")
    .select("id, item_id, rating, note, items(*)")
    .eq("tour_id", id)
    .order("added_at", { ascending: true });

  const packlistEntries = (tourItems ?? []).map((ti) => ({
    tourItemId: ti.id,
    item: ti.items as unknown as ItemRow,
    rating: ti.rating,
    note: ti.note,
  }));

  // Load child items (garage items whose parent_id is one of the packlist items).
  // These are automatically "included" in the tour weight — not explicitly added.
  const packlistItemIds = packlistEntries.map((e) => e.item.id);
  let childItemMap: Map<string, ItemRow[]> = new Map();
  if (packlistItemIds.length > 0) {
    const { data: childItems } = await supabase
      .from("items")
      .select("*")
      .in("parent_id", packlistItemIds)
      .eq("user_id", tour.user_id)
      .order("category")
      .order("brand");
    for (const child of childItems ?? []) {
      if (child.parent_id) {
        const siblings = childItemMap.get(child.parent_id) ?? [];
        siblings.push(child as ItemRow);
        childItemMap.set(child.parent_id, siblings);
      }
    }
  }

  // Collect all child item IDs to load their feedback and deduplicate the main list.
  const allChildIds: string[] = [];
  for (const children of childItemMap.values()) {
    for (const child of children) allChildIds.push(child.id);
  }

  // Load existing feedback for child items (they may have tour_items rows from prior saves).
  const childFeedbackMap: Map<string, { rating: number | null; note: string | null }> = new Map();
  if (allChildIds.length > 0) {
    const { data: childFeedback } = await supabase
      .from("tour_items")
      .select("item_id, rating, note")
      .eq("tour_id", id)
      .in("item_id", allChildIds);
    for (const row of childFeedback ?? []) {
      childFeedbackMap.set(row.item_id, { rating: row.rating, note: row.note });
    }
  }

  // Filter the main packlist: exclude items that are auto-included children.
  // This prevents duplicate display if a child item gained its own tour_items row via feedback upsert.
  const childItemIdSet = new Set(allChildIds);
  const displayedPacklistEntries = packlistEntries.filter((e) => !childItemIdSet.has(e.item.id));

  // Load all garage items for the item picker (only for owner).
  const garageItems: ItemRow[] = isOwner
    ? ((
        await supabase
          .from("items")
          .select("*")
          .eq("user_id", tour.user_id)
          .order("category")
          .order("brand")
      ).data ?? [])
    : [];

  const tourRow = tour as TourRow;

  const dateLabel =
    tourRow.end_date && tourRow.end_date !== tourRow.start_date
      ? `${formatTourDate(tourRow.start_date)} – ${formatTourDate(tourRow.end_date)}`
      : formatTourDate(tourRow.start_date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
            {dateLabel}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-cockpit-text">
              {tourRow.name}
            </h1>
            <TourStatusBadge status={tourRow.status} />
          </div>
          {(tourRow.start_location || tourRow.destination) && (
            <p className="flex items-center gap-1.5 text-sm text-cockpit-muted">
              <MapPin size={13} strokeWidth={1.75} aria-hidden className="shrink-0" />
              {[tourRow.start_location, tourRow.destination].filter(Boolean).join(" → ")}
            </p>
          )}
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <Link
              href={`/tours/${id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-md border border-cockpit-border px-3 py-2 text-sm text-cockpit-muted transition-colors hover:border-petrol-600 hover:text-petrol-300"
              aria-label="Tour bearbeiten"
            >
              <Pencil size={14} strokeWidth={1.75} aria-hidden />
              Bearbeiten
            </Link>

            <TourDeleteButton tourId={id} tourName={tourRow.name} />
          </div>
        )}
      </header>

      {/* Stats */}
      <TourStatsGrid tour={tourRow} />

      {/* Packlist */}
      <TourPacklist
        tourId={id}
        entries={displayedPacklistEntries}
        childItemMap={childItemMap}
        childFeedbackMap={childFeedbackMap}
        garageItems={garageItems}
        isOwner={isOwner}
      />
    </div>
  );
}
