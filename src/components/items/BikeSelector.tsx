import { cn } from "@/lib/utils";
import type { BikeOption } from "@/types/supabase";
import { Bike as BikeIcon, X } from "lucide-react";
import Link from "next/link";

interface BikeSelectorProps {
  bikes: BikeOption[];
  activeBikeId: string | null;
}

export function BikeSelector({ bikes, activeBikeId }: BikeSelectorProps) {
  if (bikes.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-cockpit-muted">
        Build-Fokus
      </p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Link
          href="/garage"
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
            activeBikeId === null
              ? "border-cockpit-border bg-cockpit-surface text-cockpit-text"
              : "border-cockpit-border text-cockpit-muted hover:border-petrol-600 hover:text-petrol-300"
          )}
        >
          Alle Items
        </Link>

        {bikes.map((bike) => {
          const isActive = bike.id === activeBikeId;
          return (
            <Link
              key={bike.id}
              href={`/garage?bikeId=${bike.id}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all",
                isActive
                  ? "border-petrol-500 bg-petrol-900/40 text-petrol-100 shadow-[0_0_10px_rgba(51,159,167,0.45)]"
                  : "border-cockpit-border text-cockpit-muted hover:border-petrol-600 hover:text-petrol-300"
              )}
            >
              <BikeIcon
                size={12}
                strokeWidth={1.75}
                aria-hidden
                className={isActive ? "text-petrol-300" : ""}
              />
              <span className="max-w-[14rem] truncate">
                {bike.brand}
                {bike.model ? ` ${bike.model}` : ""}
              </span>
            </Link>
          );
        })}

        {activeBikeId && (
          <Link
            href="/garage"
            title="Filter zurücksetzen"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cockpit-border px-3 py-1 text-xs text-cockpit-muted transition-colors hover:border-red-700 hover:text-red-400"
          >
            <X size={12} strokeWidth={1.75} aria-hidden />
            Zurücksetzen
          </Link>
        )}
      </div>
    </div>
  );
}
