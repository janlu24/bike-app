"use client";

import { useEffect, useState, useTransition } from "react";
import {
  previewPresetApplyAction,
  applyPresetToLiveBikeAction,
} from "@/app/(app)/garage/actions";
import type { PresetApplyDiff } from "@/app/(app)/garage/actions";
import type { ItemRow } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, Minus, Plus } from "lucide-react";

interface ApplyPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetId: string;
  presetName: string;
  onApplied: (diff: PresetApplyDiff) => void;
}

function itemLabel(item: ItemRow) {
  return [item.brand, item.model].filter(Boolean).join(" ") || item.brand;
}

export function ApplyPresetDialog({
  open,
  onOpenChange,
  presetId,
  presetName,
  onApplied,
}: ApplyPresetDialogProps) {
  const [diff, setDiff] = useState<PresetApplyDiff | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setDiff(null);
    setLoadError(null);
    setApplyError(null);
    setIsLoading(true);
    previewPresetApplyAction(presetId).then((result) => {
      setIsLoading(false);
      if ("error" in result) {
        setLoadError(result.error);
      } else {
        setDiff(result.diff);
      }
    });
  }, [open, presetId]);

  function handleApply() {
    setApplyError(null);
    startTransition(async () => {
      const result = await applyPresetToLiveBikeAction(presetId);
      if ("error" in result) {
        setApplyError(result.error);
      } else if (diff) {
        onApplied(diff);
        onOpenChange(false);
      }
    });
  }

  const hasChanges = diff
    ? diff.toUnlink.length > 0 || diff.toLink.length > 0 || diff.conflicts.length > 0
    : false;
  const isEmpty = diff
    ? diff.toLink.length === 0 && diff.conflicts.length === 0
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-cockpit-border bg-cockpit-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">
            Preset anwenden
          </DialogTitle>
          <p className="text-xs text-cockpit-muted">{presetName}</p>
        </DialogHeader>

        <div className="min-h-[80px] space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <span
                className="h-5 w-5 animate-spin rounded-full border border-petrol-500 border-t-transparent"
                aria-label="Laden…"
              />
            </div>
          )}

          {loadError && (
            <p role="alert" className="text-xs text-red-400">
              {loadError}
            </p>
          )}

          {diff && !isLoading && (
            <>
              {isEmpty && (
                <p className="rounded-md border border-cockpit-border bg-cockpit-bg px-3 py-2 text-xs text-cockpit-muted">
                  Dieses Preset hat keine Items — der Aufbau wird geleert.
                </p>
              )}

              {!hasChanges && !isEmpty && (
                <p className="rounded-md border border-petrol-700/40 bg-petrol-950/30 px-3 py-2 text-xs text-petrol-300">
                  Keine Änderungen — der aktuelle Aufbau stimmt bereits mit diesem Preset überein.
                </p>
              )}

              {diff.toUnlink.length > 0 && (
                <DiffSection
                  label="Wird gelöst"
                  items={diff.toUnlink}
                  variant="unlink"
                />
              )}

              {diff.toLink.length > 0 && (
                <DiffSection
                  label="Wird zugeordnet"
                  items={diff.toLink}
                  variant="link"
                />
              )}

              {diff.conflicts.length > 0 && (
                <>
                  <DiffSection
                    label="Wird umgehängt (aktuell anderem Bike zugeordnet)"
                    items={diff.conflicts}
                    variant="link"
                  />
                  <div className="flex items-start gap-2 rounded-md border border-amber-700/60 bg-amber-950/30 px-3 py-2">
                    <AlertTriangle
                      size={13}
                      strokeWidth={1.75}
                      className="mt-0.5 shrink-0 text-amber-400"
                      aria-hidden
                    />
                    <p className="text-xs text-amber-300">
                      Diese Items sind aktuell einem anderen Bike zugeordnet und werden auf dieses
                      Bike umgehängt.
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {applyError && (
            <p role="alert" className="text-xs text-red-400">
              {applyError}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="border-cockpit-border text-cockpit-muted hover:border-cockpit-border hover:text-cockpit-text"
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isLoading || !!loadError || isPending || !diff}
            onClick={handleApply}
            className="bg-petrol-700 text-white hover:bg-petrol-600"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                Anwenden…
              </span>
            ) : (
              "Anwenden"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiffSection({
  label,
  items,
  variant,
}: {
  label: string;
  items: ItemRow[];
  variant: "link" | "unlink";
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-widest text-cockpit-muted">{label}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded border border-cockpit-border/60 bg-cockpit-bg px-2.5 py-1.5 text-xs"
          >
            {variant === "link" ? (
              <Plus
                size={11}
                strokeWidth={2}
                className="shrink-0 text-petrol-400"
                aria-hidden
              />
            ) : (
              <Minus
                size={11}
                strokeWidth={2}
                className="shrink-0 text-cockpit-muted/60"
                aria-hidden
              />
            )}
            <span className={variant === "link" ? "text-cockpit-text" : "text-cockpit-muted"}>
              {itemLabel(item)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
