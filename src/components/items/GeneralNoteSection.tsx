"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateGeneralNoteAction } from "@/app/(app)/garage/actions";
import { Pencil } from "lucide-react";

const MAX_CHARS = 2000;

interface GeneralNoteSectionProps {
  itemId: string;
  initialNote: string | null;
}

export function GeneralNoteSection({ itemId, initialNote }: GeneralNoteSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(initialNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sync text when initialNote prop updates after server re-render.
  useEffect(() => {
    if (!isEditing) setText(initialNote ?? "");
  }, [initialNote, isEditing]);

  function handleEdit() {
    setText(initialNote ?? "");
    setError(null);
    setIsEditing(true);
  }

  function handleCancel() {
    setText(initialNote ?? "");
    setError(null);
    setIsEditing(false);
  }

  function handleSave() {
    // No-op guard: skip DB call if text hasn't changed.
    if (text.trim() === (initialNote ?? "").trim()) {
      setIsEditing(false);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateGeneralNoteAction(itemId, text);
      if ("error" in result) {
        setError(result.error);
      } else {
        setIsEditing(false);
      }
    });
  }

  const charsLeft = MAX_CHARS - text.length;
  const isOverLimit = charsLeft < 0;

  return (
    <section aria-labelledby="general-note-heading" className="space-y-3">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
          Notizen
        </p>
        <h2
          id="general-note-heading"
          className="text-base font-semibold text-cockpit-text"
        >
          Allgemeine Kommentare
        </h2>
      </div>

      <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-4 shadow-cockpit">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              aria-label="Allgemeiner Kommentar zum Item"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="z. B. Knarzt bei Nässe, perfekte Passform im Winter …"
              className="min-h-[100px] resize-none border-cockpit-border bg-cockpit-bg text-sm text-cockpit-text placeholder:text-cockpit-muted/50 focus-visible:ring-petrol-500"
              disabled={isPending}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <div className="flex items-center justify-between gap-3">
              <p
                aria-live="polite"
                className={`text-[11px] tabular-nums ${isOverLimit ? "text-red-400" : "text-cockpit-muted"}`}
              >
                {charsLeft.toLocaleString("de-DE")} / {MAX_CHARS.toLocaleString("de-DE")}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="text-xs text-cockpit-muted hover:text-cockpit-text"
                >
                  Abbrechen
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={isPending || isOverLimit}
                  className="text-xs bg-petrol-600 hover:bg-petrol-500 text-white border-0"
                >
                  {isPending ? "Speichern …" : "Speichern"}
                </Button>
              </div>
            </div>
            {error && (
              <p role="alert" className="text-xs text-red-400">
                {error}
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleEdit}
            aria-label={
              initialNote ? "Kommentar bearbeiten" : "Kommentar hinzufügen"
            }
            className="group w-full text-left"
          >
            {initialNote ? (
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-wrap text-sm text-cockpit-text">
                  {initialNote}
                </p>
                <Pencil
                  size={14}
                  strokeWidth={1.75}
                  aria-hidden
                  className="mt-0.5 shrink-0 text-cockpit-muted opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 py-1 text-cockpit-muted/50 transition-colors group-hover:text-cockpit-muted">
                <Pencil size={14} strokeWidth={1.75} aria-hidden />
                <span className="text-sm italic">
                  Noch kein Kommentar — klicken zum Hinzufügen
                </span>
              </div>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
