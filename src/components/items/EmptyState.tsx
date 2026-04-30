import { Bike, Plus } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  filtered: boolean;
  hint?: string;
}

export function EmptyState({ filtered, hint }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-petrol-800/60 bg-cockpit-surface/60 p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-petrol-700/50 bg-petrol-950/40 text-petrol-300">
        <Bike size={26} strokeWidth={1.5} aria-hidden />
      </div>
      <p className="text-[11px] uppercase tracking-widest text-petrol-300">
        {filtered ? "Keine Treffer" : "Library leer"}
      </p>
      <h2 className="mt-1 text-base font-semibold text-cockpit-text">
        {filtered
          ? "Für diesen Filter ist nichts hinterlegt."
          : "Noch nichts in deiner Garage."}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-cockpit-muted">
        {hint ??
          "Lege dein erstes Rad oder Bauteil an – inkl. flexibler Zusatz-Attribute wie Farbe, Rahmengröße oder Gear-Ratio."}
      </p>

      <Link
        href="/garage/new"
        className="mt-5 inline-flex items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-3.5 py-2 text-sm font-medium text-white shadow-cockpit transition-colors hover:bg-petrol-500"
      >
        <Plus size={16} strokeWidth={2} aria-hidden />
        Neues Item anlegen
      </Link>
    </div>
  );
}
