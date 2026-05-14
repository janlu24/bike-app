import { GroupForm } from "@/components/groups/GroupForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Neue Gruppe · Setup Registry",
};

export default function NewGroupPage() {
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <Link
          href="/inventory/groups"
          className="mb-3 inline-flex items-center gap-1 text-xs text-cockpit-muted hover:text-cockpit-text"
        >
          <ChevronLeft size={14} strokeWidth={1.75} aria-hidden />
          Zurück zu Gruppen
        </Link>
        <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
          Neue Gruppe
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Gruppe <span className="text-petrol-400">anlegen</span>
        </h1>
        <p className="mt-1 text-sm text-cockpit-muted">
          Definiere die Eigenschaften, die alle Items dieser Gruppe teilen.
        </p>
      </div>

      <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-5 shadow-cockpit">
        <GroupForm />
      </div>
    </div>
  );
}
