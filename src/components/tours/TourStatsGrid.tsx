import type { TourRow } from "@/types/supabase";
import { formatDistance, formatElevation, formatDuration } from "@/lib/tours/utils";

interface TourStatsGridProps {
  tour: TourRow;
}

type StatEntry = { label: string; planned: string; actual: string };

export function TourStatsGrid({ tour }: TourStatsGridProps) {
  const rows: StatEntry[] = [
    {
      label: "Distanz",
      planned: formatDistance(tour.planned_distance_km),
      actual: formatDistance(tour.actual_distance_km),
    },
    {
      label: "Höhenmeter ↑",
      planned: formatElevation(tour.planned_elevation_up_m),
      actual: formatElevation(tour.actual_elevation_up_m),
    },
    {
      label: "Höhenmeter ↓",
      planned: formatElevation(tour.planned_elevation_down_m),
      actual: formatElevation(tour.actual_elevation_down_m),
    },
    {
      label: "Dauer",
      planned: "–",
      actual: formatDuration(tour.duration_hours, tour.duration_minutes),
    },
  ];

  const hasAnyData = rows.some((r) => r.planned !== "–" || r.actual !== "–");
  if (!hasAnyData) return null;

  return (
    <div className="rounded-lg border border-cockpit-border bg-cockpit-surface shadow-cockpit overflow-hidden">
      <table className="w-full text-sm" role="table" aria-label="Tour-Statistiken">
        <thead>
          <tr className="border-b border-cockpit-border">
            <th className="py-2 pl-4 text-left text-[10px] uppercase tracking-widest text-cockpit-muted font-medium w-1/3">
              Metrik
            </th>
            <th className="py-2 text-right text-[10px] uppercase tracking-widest text-cockpit-muted font-medium w-1/3">
              Geplant
            </th>
            <th className="py-2 pr-4 text-right text-[10px] uppercase tracking-widest text-petrol-400 font-medium w-1/3">
              Gefahren
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            if (row.planned === "–" && row.actual === "–") return null;
            return (
              <tr
                key={row.label}
                className={i < rows.length - 1 ? "border-b border-cockpit-border/50" : ""}
              >
                <td className="py-2.5 pl-4 text-cockpit-muted text-xs">{row.label}</td>
                <td className="py-2.5 text-right text-cockpit-text tabular-nums text-xs">{row.planned}</td>
                <td className="py-2.5 pr-4 text-right text-cockpit-text tabular-nums text-xs">{row.actual}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
