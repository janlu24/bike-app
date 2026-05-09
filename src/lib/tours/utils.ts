import type { TourRow } from "@/types/supabase";

export function formatDuration(hours: number | null, minutes: number | null): string {
  if (hours === null && minutes === null) return "–";
  const h = hours ?? 0;
  const m = minutes ?? 0;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h}h ${m} min`;
}

export function formatDistance(km: number | null): string {
  if (km === null) return "–";
  return `${km.toLocaleString("de-DE", { maximumFractionDigits: 1 })} km`;
}

export function formatElevation(m: number | null): string {
  if (m === null) return "–";
  return `${m.toLocaleString("de-DE")} m`;
}

/** Returns the km value to display on the tour card: actual if completed, planned otherwise. */
export function getDisplayDistance(tour: Pick<TourRow, "status" | "actual_distance_km" | "planned_distance_km">): number | null {
  if (tour.status === "completed" && tour.actual_distance_km !== null) {
    return tour.actual_distance_km;
  }
  return tour.planned_distance_km;
}

export function formatTourDate(dateStr: string | null): string {
  if (!dateStr) return "–";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
