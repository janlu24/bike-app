import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TourStatusBadge } from "@/components/tours/TourStatusBadge";
import { StarDisplay } from "@/components/tours/StarDisplay";
import { formatTourDate } from "@/lib/tours/utils";
import type { TourStatus } from "@/types/supabase";

interface ItemTourHistoryProps {
  itemId: string;
}

export async function ItemTourHistory({ itemId }: ItemTourHistoryProps) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("tour_items")
    .select("rating, tours(id, name, start_date, end_date, status)")
    .eq("item_id", itemId)
    .limit(50);

  type TourRef = { id: string; name: string; start_date: string | null; end_date: string | null; status: string };
  type Entry = { rating: number | null; tours: TourRef | null };

  const entries = ((data ?? []) as Entry[])
    .filter((e): e is Entry & { tours: TourRef } => e.tours !== null)
    .sort((a, b) => {
      const aDate = a.tours.start_date ?? "";
      const bDate = b.tours.start_date ?? "";
      return bDate.localeCompare(aDate);
    });

  return (
    <section aria-labelledby="tour-history-heading" className="space-y-3">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">Touren</p>
        <h2 id="tour-history-heading" className="text-base font-semibold text-cockpit-text">
          Nutzungshistorie
        </h2>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-cockpit-border py-6 text-center text-sm text-cockpit-muted">
          Noch bei keiner Tour genutzt
        </p>
      ) : (
        <ul className="space-y-1.5" role="list">
          {entries.map(({ rating, tours: tour }) => {
            const dateLabel =
              tour.end_date && tour.end_date !== tour.start_date
                ? `${formatTourDate(tour.start_date)} – ${formatTourDate(tour.end_date)}`
                : formatTourDate(tour.start_date);

            return (
              <li key={tour.id}>
                <Link
                  href={`/tours/${tour.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-cockpit-border bg-cockpit-surface px-3 py-2.5 transition-colors hover:border-petrol-700 hover:bg-cockpit-surface/80"
                  aria-label={`Tour ${tour.name} vom ${dateLabel} aufrufen`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cockpit-text truncate">{tour.name}</p>
                    <p className="text-xs text-cockpit-muted">{dateLabel}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {rating !== null && <StarDisplay rating={rating} size={12} />}
                    <TourStatusBadge status={tour.status as TourStatus} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
