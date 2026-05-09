import { TourStatusBadge } from "@/components/tours/TourStatusBadge";
import { TourStatsGrid } from "@/components/tours/TourStatsGrid";
import { TourPacklist } from "@/components/tours/TourPacklist";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteTourAction } from "@/app/(app)/tours/actions";
import { formatTourDate } from "@/lib/tours/utils";
import type { ItemRow, TourRow } from "@/types/supabase";
import { MapPin, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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

  // Load packlist items with a join.
  const { data: tourItems } = await supabase
    .from("tour_items")
    .select("id, item_id, items(*)")
    .eq("tour_id", id)
    .order("added_at", { ascending: true });

  const packlistEntries = (tourItems ?? []).map((ti) => ({
    tourItemId: ti.id,
    item: ti.items as unknown as ItemRow,
  }));

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
            {formatTourDate(tourRow.date)}
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

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cockpit-muted hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900"
                >
                  Löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-cockpit-surface border-cockpit-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Tour wirklich löschen?</AlertDialogTitle>
                  <AlertDialogDescription className="text-cockpit-muted">
                    „{tourRow.name}" und alle Packlisten-Einträge werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <form action={deleteTourAction}>
                    <input type="hidden" name="id" value={id} />
                    <AlertDialogAction
                      type="submit"
                      className="bg-red-700 text-white hover:bg-red-600"
                    >
                      Löschen
                    </AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </header>

      {/* Stats */}
      <TourStatsGrid tour={tourRow} />

      {/* Packlist */}
      <TourPacklist
        tourId={id}
        entries={packlistEntries}
        garageItems={garageItems}
        isOwner={isOwner}
      />
    </div>
  );
}
