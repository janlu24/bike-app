"use client";

import { useState, useTransition } from "react";
import {
  renamePresetAction,
  deletePresetAction,
} from "@/app/(app)/garage/actions";
import type { PresetApplyDiff } from "@/app/(app)/garage/actions";
import type { BikePresetRow, BikePresetWithItems } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Check,
  GitBranch,
  Pencil,
  Play,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { ApplyPresetDialog } from "./ApplyPresetDialog";
import { CreatePresetDialog } from "./CreatePresetDialog";
import { PresetSandboxSheet } from "./PresetSandboxSheet";

interface PresetPanelProps {
  bikeId: string;
  initialPresets: BikePresetWithItems[];
  currentPartIds: string[];
  onPresetApplied: (diff: PresetApplyDiff) => void;
}

export function PresetPanel({
  bikeId,
  initialPresets,
  currentPartIds,
  onPresetApplied,
}: PresetPanelProps) {
  const [presets, setPresets] = useState(initialPresets);
  const [createOpen, setCreateOpen] = useState(false);

  const currentPartIdSet = new Set(currentPartIds);

  function handleCreated(preset: BikePresetRow, wasSnapshotted: boolean) {
    setPresets((prev) => [
      ...prev,
      {
        ...preset,
        preset_items: wasSnapshotted
          ? currentPartIds.map((id) => ({ item_id: id }))
          : [],
      },
    ]);
  }

  function handleRenamed(id: string, name: string) {
    setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }

  function handleDeleted(id: string) {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }

  function handleApplied(diff: PresetApplyDiff) {
    onPresetApplied(diff);
  }

  function handleItemsChanged(presetId: string, newItemIds: string[]) {
    setPresets((prev) =>
      prev.map((p) =>
        p.id === presetId
          ? { ...p, preset_items: newItemIds.map((id) => ({ item_id: id })) }
          : p
      )
    );
  }

  return (
    <section aria-label="Presets" className="space-y-3">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitBranch
            size={14}
            strokeWidth={1.75}
            className="text-petrol-400"
            aria-hidden
          />
          <h2 className="text-[11px] uppercase tracking-widest text-cockpit-muted">
            Presets
          </h2>
          <span className="text-[11px] text-cockpit-muted">· {presets.length}</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setCreateOpen(true)}
          className="h-7 border-cockpit-border px-2.5 text-xs text-cockpit-muted hover:border-petrol-600 hover:text-petrol-300"
        >
          <GitBranch size={11} strokeWidth={1.75} aria-hidden className="mr-1.5" />
          Als Preset speichern
        </Button>
      </header>

      {presets.length === 0 ? (
        <div className="rounded-md border border-cockpit-border/50 border-dashed px-4 py-5 text-center">
          <p className="text-xs text-cockpit-muted">
            Noch kein Preset gespeichert. Speichere den aktuellen Aufbau als Preset.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              currentPartIdSet={currentPartIdSet}
              onRenamed={handleRenamed}
              onDeleted={handleDeleted}
              onApplied={handleApplied}
              onItemsChanged={handleItemsChanged}
            />
          ))}
        </ul>
      )}

      <CreatePresetDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        bikeId={bikeId}
        currentPartCount={currentPartIds.length}
        onCreated={handleCreated}
      />
    </section>
  );
}

function PresetCard({
  preset,
  currentPartIdSet,
  onRenamed,
  onDeleted,
  onApplied,
  onItemsChanged,
}: {
  preset: BikePresetWithItems;
  currentPartIdSet: Set<string>;
  onRenamed: (id: string, name: string) => void;
  onDeleted: (id: string) => void;
  onApplied: (diff: PresetApplyDiff) => void;
  onItemsChanged: (presetId: string, newItemIds: string[]) => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(preset.name);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenamePending, startRenameTransition] = useTransition();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockedTourNames, setBlockedTourNames] = useState<string[] | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletePending, startDeleteTransition] = useTransition();

  const [applyOpen, setApplyOpen] = useState(false);
  const [sandboxOpen, setSandboxOpen] = useState(false);

  const presetItemCount = preset.preset_items.length;
  const matchesCurrentBuild =
    presetItemCount > 0 &&
    presetItemCount === currentPartIdSet.size &&
    preset.preset_items.every((pi) => currentPartIdSet.has(pi.item_id));

  function startRename() {
    setRenameValue(preset.name);
    setRenameError(null);
    setIsRenaming(true);
  }

  function cancelRename() {
    setIsRenaming(false);
    setRenameError(null);
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === preset.name) {
      setIsRenaming(false);
      return;
    }
    setRenameError(null);
    startRenameTransition(async () => {
      const result = await renamePresetAction(preset.id, trimmed);
      if ("error" in result) {
        setRenameError(result.error);
      } else {
        onRenamed(preset.id, trimmed);
        setIsRenaming(false);
      }
    });
  }

  function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") cancelRename();
  }

  function openDeleteDialog() {
    setBlockedTourNames(null);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    startDeleteTransition(async () => {
      const result = await deletePresetAction(preset.id);
      if ("error" in result) {
        setDeleteError(result.error);
      } else if ("blocked" in result) {
        setBlockedTourNames(result.tourNames);
      } else {
        onDeleted(preset.id);
        setDeleteDialogOpen(false);
      }
    });
  }

  return (
    <li className="rounded-lg border border-cockpit-border bg-cockpit-bg">
      <div className="flex items-center gap-2 px-3 py-2.5">
        {isRenaming ? (
          <div className="flex flex-1 items-center gap-1.5">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value.slice(0, 50))}
              onKeyDown={handleRenameKeyDown}
              maxLength={50}
              autoFocus
              disabled={isRenamePending}
              className="h-6 flex-1 border-cockpit-border bg-cockpit-surface px-2 py-0 text-xs focus-visible:ring-petrol-500"
              aria-label="Preset umbenennen"
            />
            <button
              type="button"
              onClick={commitRename}
              disabled={isRenamePending}
              aria-label="Umbenennung bestätigen"
              className="flex h-5 w-5 items-center justify-center rounded border border-petrol-700 text-petrol-400 hover:bg-petrol-900/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-petrol-500 disabled:opacity-50"
            >
              <Check size={11} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={cancelRename}
              disabled={isRenamePending}
              aria-label="Umbenennung abbrechen"
              className="flex h-5 w-5 items-center justify-center rounded border border-cockpit-border text-cockpit-muted hover:text-cockpit-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-petrol-500 disabled:opacity-50"
            >
              <X size={11} strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            <span className="truncate text-sm font-medium">{preset.name}</span>
            <span className="shrink-0 text-[10px] text-cockpit-muted">
              {presetItemCount} {presetItemCount === 1 ? "Item" : "Items"}
            </span>
            <span className="shrink-0 text-[10px] text-cockpit-muted/60">
              {new Date(preset.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
            </span>
            {matchesCurrentBuild && (
              <span className="shrink-0 rounded border border-petrol-700/60 bg-petrol-950/40 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-petrol-300">
                Aktiv
              </span>
            )}
          </div>
        )}

        {!isRenaming && (
          <div className="flex shrink-0 items-center gap-1">
            <IconButton
              aria-label="Preset anwenden"
              title="Anwenden"
              onClick={() => setApplyOpen(true)}
              className="text-petrol-400 hover:border-petrol-700 hover:text-petrol-300"
            >
              <Play size={11} strokeWidth={1.75} aria-hidden />
            </IconButton>
            <IconButton
              aria-label="Preset bearbeiten"
              title="Bearbeiten"
              onClick={() => setSandboxOpen(true)}
              className="text-cockpit-muted hover:border-amber-700/60 hover:text-amber-300"
            >
              <SlidersHorizontal size={11} strokeWidth={1.75} aria-hidden />
            </IconButton>
            <IconButton
              aria-label="Preset umbenennen"
              title="Umbenennen"
              onClick={startRename}
              className="text-cockpit-muted hover:border-cockpit-border hover:text-cockpit-text"
            >
              <Pencil size={11} strokeWidth={1.75} aria-hidden />
            </IconButton>
            <IconButton
              aria-label="Preset löschen"
              title="Löschen"
              onClick={openDeleteDialog}
              className="text-cockpit-muted/60 hover:border-red-800/60 hover:text-red-400"
            >
              <Trash2 size={11} strokeWidth={1.75} aria-hidden />
            </IconButton>
          </div>
        )}
      </div>

      {renameError && (
        <p role="alert" className="px-3 pb-2 text-[11px] text-red-400">
          {renameError}
        </p>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-cockpit-border bg-cockpit-surface sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight">
              Preset löschen?
            </DialogTitle>
          </DialogHeader>

          {blockedTourNames ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-md border border-amber-700/60 bg-amber-950/30 px-3 py-2">
                <AlertTriangle
                  size={13}
                  strokeWidth={1.75}
                  className="mt-0.5 shrink-0 text-amber-400"
                  aria-hidden
                />
                <div className="space-y-1">
                  <p className="text-xs text-amber-300">
                    Dieses Preset ist noch {blockedTourNames.length === 1 ? "einer Tour" : `${blockedTourNames.length} Touren`} zugeordnet:
                  </p>
                  <ul className="list-disc pl-3 text-[11px] text-amber-300/80">
                    {blockedTourNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-xs text-cockpit-muted">
                Entferne das Preset zuerst aus diesen Touren, bevor du es löschen kannst.
              </p>
            </div>
          ) : (
            <p className="text-sm text-cockpit-muted">
              „{preset.name}" wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht
              werden.
            </p>
          )}

          {deleteError && (
            <p role="alert" className="text-xs text-red-400">
              {deleteError}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeletePending}
              onClick={() => setDeleteDialogOpen(false)}
              className="border-cockpit-border text-cockpit-muted hover:border-cockpit-border hover:text-cockpit-text"
            >
              {blockedTourNames ? "Schließen" : "Abbrechen"}
            </Button>
            {!blockedTourNames && (
              <Button
                type="button"
                size="sm"
                disabled={isDeletePending}
                onClick={confirmDelete}
                className="bg-red-900 text-red-100 hover:bg-red-800"
              >
                {isDeletePending ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border border-red-200 border-t-transparent" />
                    Löschen…
                  </span>
                ) : (
                  "Löschen"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Preset Dialog */}
      <ApplyPresetDialog
        open={applyOpen}
        onOpenChange={setApplyOpen}
        presetId={preset.id}
        presetName={preset.name}
        onApplied={(diff) => {
          setApplyOpen(false);
          onApplied(diff);
        }}
      />

      {/* Sandbox Edit Sheet */}
      <PresetSandboxSheet
        open={sandboxOpen}
        onOpenChange={setSandboxOpen}
        preset={preset}
        onPresetItemsChanged={onItemsChanged}
      />
    </li>
  );
}

function IconButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      type="button"
      {...props}
      className={`flex h-5 w-5 items-center justify-center rounded border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-petrol-500 disabled:opacity-50 ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
