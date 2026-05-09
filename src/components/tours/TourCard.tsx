import { TourStatusBadge } from "./TourStatusBadge";
import { formatDistance, formatTourDate, getDisplayDistance } from "@/lib/tours/utils";
import type { TourRow } from "@/types/supabase";
import { MapPin, Package } from "lucide-react";
import Link from "next/link";

interface TourCardProps {
  tour: TourRow;
  itemCount: number;
}

export function TourCard({ tour, itemCount }: TourCardProps) {
  const displayKm = getDisplayDistance(tour);
  const hasLocation = tour.start_location || tour.destination;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-cockpit-border bg-cockpit-surface shadow-cockpit transition-colors hover:border-petrol-700">
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-cockpit-muted">
              {formatTourDate(tour.date)}
            </p>
            <h3 className="mt-0.5 truncate text-sm font-semibold text-cockpit-text leading-snug">
              {tour.name}
            </h3>
          </div>
          <TourStatusBadge status={tour.status} className="shrink-0 mt-0.5" />
        </header>

        {hasLocation && (
          <div className="flex items-center gap-1.5 text-xs text-cockpit-muted">
            <MapPin size={11} strokeWidth={1.75} aria-hidden className="shrink-0" />
            <span className="truncate">
              {[tour.start_location, tour.destination].filter(Boolean).join(" → ")}
            </span>
          </div>
        )}

        <dl className="flex items-center gap-4 border-t border-cockpit-border pt-3 text-xs">
          {displayKm !== null && (
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-cockpit-muted">km</dt>
              <dd className="tabular-nums text-cockpit-text">{formatDistance(displayKm)}</dd>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-cockpit-muted ml-auto">
            <Package size={12} strokeWidth={1.75} aria-hidden />
            <span>{itemCount} Item{itemCount !== 1 ? "s" : ""}</span>
          </div>
        </dl>

        <footer className="flex justify-end">
          <Link
            href={`/tours/${tour.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-cockpit-border px-2.5 py-1 text-xs text-cockpit-muted transition-colors hover:border-petrol-600 hover:text-petrol-300"
            aria-label={`Tour ${tour.name} öffnen`}
          >
            Öffnen
          </Link>
        </footer>
      </div>
    </article>
  );
}
