"use client";

import { useState, useTransition } from "react";
import { createPresetAction } from "@/app/(app)/garage/actions";
import type { BikePresetRow } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreatePresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bikeId: string;
  currentPartCount?: number;
  onCreated: (preset: BikePresetRow, wasSnapshotted: boolean) => void;
  planningMode?: boolean;
}

export function CreatePresetDialog({
  open,
  onOpenChange,
  bikeId,
  currentPartCount = 0,
  onCreated,
  planningMode = false,
}: CreatePresetDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [snapshot, setSnapshot] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (isPending) return;
    if (!next) {
      setName("");
      setDescription("");
      setSnapshot(true);
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const useSnapshot = snapshot && currentPartCount > 0;
    startTransition(async () => {
      const result = await createPresetAction(bikeId, name.trim(), description.trim() || null, useSnapshot);
      if ("error" in result) {
        setError(result.error);
      } else {
        onCreated(result.preset, useSnapshot);
        handleOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-cockpit-border bg-cockpit-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">
            {planningMode ? "Neues Preset planen" : "Preset speichern"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="preset-name" className="text-xs text-cockpit-muted">
                Name
              </Label>
              <span className="text-[10px] text-cockpit-muted">
                {name.length}/50
              </span>
            </div>
            <Input
              id="preset-name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              placeholder="z. B. Sommer-Setup"
              maxLength={50}
              required
              autoFocus
              disabled={isPending}
              className="border-cockpit-border bg-cockpit-bg text-cockpit-text placeholder:text-cockpit-muted/50 focus-visible:ring-petrol-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="preset-description" className="text-xs text-cockpit-muted">
                Beschreibung{" "}
                <span className="text-cockpit-muted/60">(optional)</span>
              </Label>
              <span className="text-[10px] text-cockpit-muted">
                {description.length}/200
              </span>
            </div>
            <Textarea
              id="preset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="Leichtes Setup für Bergrennen …"
              maxLength={200}
              rows={3}
              disabled={isPending}
              className="resize-none border-cockpit-border bg-cockpit-bg text-cockpit-text placeholder:text-cockpit-muted/50 focus-visible:ring-petrol-500"
            />
          </div>

          {currentPartCount > 0 ? (
            <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-cockpit-border/60 px-3 py-2.5">
              <Checkbox
                id="snapshot-checkbox"
                checked={snapshot}
                onCheckedChange={(v) => setSnapshot(v === true)}
                disabled={isPending}
                className="border-cockpit-border data-[state=checked]:border-petrol-600 data-[state=checked]:bg-petrol-700"
              />
              <div>
                <p className="text-xs text-cockpit-text">
                  Aktuellen Aufbau übernehmen
                  <span className="ml-1 text-cockpit-muted">({currentPartCount} {currentPartCount === 1 ? "Item" : "Items"})</span>
                </p>
                {!snapshot && (
                  <p className="mt-0.5 text-[10px] text-cockpit-muted">
                    Leeres Preset — füge Teile später im Bearbeitungsmodus hinzu.
                  </p>
                )}
              </div>
            </label>
          ) : (
            <p className="rounded-md border border-dashed border-cockpit-border/50 px-3 py-2 text-[11px] text-cockpit-muted">
              Leeres Preset — füge Teile später im Bearbeitungsmodus hinzu.
            </p>
          )}

          {error && (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
              className="border-cockpit-border text-cockpit-muted hover:border-cockpit-border hover:text-cockpit-text"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || name.trim().length === 0}
              className="bg-petrol-700 text-white hover:bg-petrol-600"
            >
              {isPending ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  Speichern…
                </span>
              ) : (
                "Speichern"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
