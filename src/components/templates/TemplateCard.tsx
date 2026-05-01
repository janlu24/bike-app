"use client";

import { deleteTemplateAction } from "@/app/(app)/garage/templates/actions";
import { CATEGORY_CONFIG } from "@/lib/items/categories";
import type { ItemCategory } from "@/types/supabase";
import { BarChart2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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

interface TemplateCardProps {
  id: string;
  name: string;
  category: ItemCategory;
  keyCount: number;
  linkedItemCount: number;
}

export function TemplateCard({
  id,
  name,
  category,
  keyCount,
  linkedItemCount,
}: TemplateCardProps) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  const canCompare = linkedItemCount >= 2;
  const [deleting, setDeleting] = useState(false);

  return (
    <article className="flex items-start justify-between gap-3 rounded-lg border border-cockpit-border bg-cockpit-surface p-4 shadow-cockpit transition-colors hover:border-petrol-700">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-1.5">
          <Icon size={13} strokeWidth={1.75} className="shrink-0 text-petrol-400" aria-hidden />
          <span className="truncate text-sm font-medium text-cockpit-text">{name}</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-cockpit-muted">
          <span>{keyCount} {keyCount === 1 ? "Schlüssel" : "Schlüssel"}</span>
          <span>·</span>
          <span>{linkedItemCount} {linkedItemCount === 1 ? "Item" : "Items"}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* Compare */}
        {canCompare ? (
          <Link
            href={`/garage/templates/${id}/compare`}
            className="inline-flex items-center gap-1 rounded-md border border-cockpit-border px-2 py-1 text-xs text-cockpit-muted transition-colors hover:border-petrol-600 hover:text-petrol-300"
            title="Vergleichsansicht"
          >
            <BarChart2 size={13} strokeWidth={1.75} aria-hidden />
            Vergleich
          </Link>
        ) : (
          <span
            title="Mindestens 2 verknüpfte Items nötig"
            className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-cockpit-border px-2 py-1 text-xs text-cockpit-muted opacity-40"
            aria-disabled="true"
          >
            <BarChart2 size={13} strokeWidth={1.75} aria-hidden />
            Vergleich
          </span>
        )}

        {/* Edit */}
        <Link
          href={`/garage/templates/${id}/edit`}
          className="inline-flex items-center gap-1 rounded-md border border-cockpit-border px-2 py-1 text-xs text-cockpit-muted transition-colors hover:border-petrol-600 hover:text-petrol-300"
          title="Vorlage bearbeiten"
        >
          <Pencil size={13} strokeWidth={1.75} aria-hidden />
          Bearbeiten
        </Link>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="inline-flex items-center rounded-md border border-cockpit-border p-1.5 text-cockpit-muted transition-colors hover:border-red-700 hover:text-red-400"
              title="Vorlage löschen"
              aria-label={`Vorlage "${name}" löschen`}
            >
              <Trash2 size={13} strokeWidth={1.75} aria-hidden />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-cockpit-border bg-cockpit-surface text-cockpit-text">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base">
                Vorlage löschen?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-cockpit-muted">
                {linkedItemCount > 0 ? (
                  <>
                    <strong className="text-cockpit-text">{linkedItemCount}</strong>{" "}
                    {linkedItemCount === 1 ? "verknüpftes Item wird" : "verknüpfte Items werden"} zu{" "}
                    freien Items — es gehen{" "}
                    <strong className="text-cockpit-text">keine Daten verloren</strong>.
                  </>
                ) : (
                  "Diese Vorlage hat keine verknüpften Items und wird dauerhaft gelöscht."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-cockpit-border bg-transparent text-cockpit-muted hover:bg-cockpit-surface hover:text-cockpit-text">
                Abbrechen
              </AlertDialogCancel>
              <form
                action={deleteTemplateAction}
                onSubmit={() => setDeleting(true)}
              >
                <input type="hidden" name="id" value={id} />
                <AlertDialogAction
                  asChild
                >
                  <button
                    type="submit"
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-900 bg-red-700/80 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={13} strokeWidth={2} aria-hidden />
                    {deleting ? "Löschen …" : "Vorlage löschen"}
                  </button>
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </article>
  );
}
