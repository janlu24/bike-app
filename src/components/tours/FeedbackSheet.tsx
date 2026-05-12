"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "./StarRating";
import { upsertFeedbackAction, deleteFeedbackAction } from "@/app/(app)/tours/actions";
import { MessageSquarePlus, MessageSquareText } from "lucide-react";

interface FeedbackSheetProps {
  tourId: string;
  itemId: string;
  itemLabel: string;
  initialRating: number | null;
  initialNote: string | null;
}

const MAX_NOTE_LENGTH = 1000;

export function FeedbackSheet({
  tourId,
  itemId,
  itemLabel,
  initialRating,
  initialNote,
}: FeedbackSheetProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(initialRating);
  const [note, setNote] = useState(initialNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sync form state when server re-renders with fresh props (after save).
  useEffect(() => {
    if (!open) {
      setRating(initialRating);
      setNote(initialNote ?? "");
      setError(null);
    }
  }, [initialRating, initialNote, open]);

  const hasExistingFeedback =
    initialRating !== null || (initialNote !== null && initialNote.length > 0);

  const canSave = rating !== null || note.trim().length > 0;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await upsertFeedbackAction(
        tourId,
        itemId,
        rating,
        note.trim() || null,
      );
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteFeedbackAction(tourId, itemId);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-cockpit-muted hover:text-petrol-300"
          aria-label={
            hasExistingFeedback
              ? `Feedback für ${itemLabel} bearbeiten`
              : `Feedback für ${itemLabel} hinzufügen`
          }
        >
          {hasExistingFeedback ? (
            <MessageSquareText size={13} strokeWidth={1.75} aria-hidden />
          ) : (
            <MessageSquarePlus size={13} strokeWidth={1.75} aria-hidden />
          )}
          {hasExistingFeedback ? "Feedback bearbeiten" : "Feedback hinzufügen"}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="rounded-t-xl border-cockpit-border bg-cockpit-surface max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader className="mb-5">
          <SheetTitle className="text-cockpit-text">{itemLabel}</SheetTitle>
          <p className="text-xs text-cockpit-muted">Bewertung und Notiz nach der Tour</p>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {/* Star rating */}
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-widest text-cockpit-muted">
              Bewertung (optional)
            </Label>
            <div className="flex items-center gap-3">
              <StarRating
                value={rating}
                onChange={setRating}
                name={`feedback-${itemId}`}
              />
              {rating !== null && (
                <button
                  type="button"
                  onClick={() => setRating(null)}
                  className="text-xs text-cockpit-muted transition-colors hover:text-red-400"
                  aria-label="Bewertung zurücksetzen"
                >
                  Zurücksetzen
                </button>
              )}
            </div>
          </div>

          {/* Note textarea */}
          <div className="space-y-2">
            <Label
              htmlFor={`note-${itemId}`}
              className="text-[11px] uppercase tracking-widest text-cockpit-muted"
            >
              Notiz (optional)
            </Label>
            <Textarea
              id={`note-${itemId}`}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
              placeholder="Was hat gut oder schlecht funktioniert?"
              rows={4}
              className="resize-none border-cockpit-border bg-cockpit-bg text-cockpit-text placeholder:text-cockpit-muted/60"
              aria-describedby={`note-counter-${itemId}`}
            />
            <p
              id={`note-counter-${itemId}`}
              aria-live="polite"
              className={`text-right text-xs tabular-nums ${
                note.length >= MAX_NOTE_LENGTH ? "text-red-400" : "text-cockpit-muted"
              }`}
            >
              {note.length} / {MAX_NOTE_LENGTH}
            </p>
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {hasExistingFeedback ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={handleDelete}
                className="text-xs text-cockpit-muted hover:bg-red-950/20 hover:text-red-400"
              >
                Löschen
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setOpen(false)}
                className="border-cockpit-border text-xs text-cockpit-muted"
              >
                Abbrechen
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isPending || !canSave}
                onClick={handleSave}
                className="bg-petrol-700 text-xs text-white hover:bg-petrol-600"
              >
                {isPending ? "Speichere…" : "Speichern"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
