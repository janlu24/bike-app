import { TemplateForm } from "@/components/templates/TemplateForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Neue Vorlage · Setup Registry",
};

export default function NewTemplatePage() {
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <Link
          href="/garage/templates"
          className="mb-3 inline-flex items-center gap-1 text-xs text-cockpit-muted hover:text-cockpit-text"
        >
          <ChevronLeft size={14} strokeWidth={1.75} aria-hidden />
          Zurück zu Vorlagen
        </Link>
        <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
          Neue Vorlage
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Vorlage <span className="text-petrol-400">anlegen</span>
        </h1>
        <p className="mt-1 text-sm text-cockpit-muted">
          Definiere die Eigenschaften, die alle Items dieser Vorlage teilen.
        </p>
      </div>

      <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-5 shadow-cockpit">
        <TemplateForm />
      </div>
    </div>
  );
}
