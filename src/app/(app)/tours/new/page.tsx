import { TourForm } from "@/components/tours/TourForm";
import { createTourAction } from "@/app/(app)/tours/actions";

export const metadata = {
  title: "Neue Tour · Setup Registry",
};

export default function NewTourPage() {
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">Neue Tour</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tour <span className="text-petrol-400">anlegen</span>
        </h1>
        <p className="mt-1 text-sm text-cockpit-muted">
          Pflicht: Name. Alles andere optional – füge Daten vor oder nach der Tour ein.
        </p>
      </div>

      <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-5 shadow-cockpit">
        <TourForm action={createTourAction} submitLabel="Tour anlegen" />
      </div>
    </div>
  );
}
