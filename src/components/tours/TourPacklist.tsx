"use client";

import React, { useTransition, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ItemPickerSheet } from "./ItemPickerSheet";
import { FeedbackSheet } from "./FeedbackSheet";
import { StarDisplay } from "./StarDisplay";
import { removeTourItemAction, toggleCheckOffAction } from "@/app/(app)/tours/actions";
import { CATEGORY_CONFIG } from "@/lib/items/categories";
import { formatWeight, formatWeight3dp } from "@/lib/utils/weight";
import type { ItemRow } from "@/types/supabase";
import { Badge } from "@/components/ui/badge";
import { Scale, Trash2, ChevronDown, ChevronUp, FileDown, Loader2, Bike, Package, Shirt } from "lucide-react";

interface PacklistEntry {
  tourItemId: string;
  item: ItemRow;
  rating: number | null;
  note: string | null;
  is_checked: boolean;
}

interface TourPacklistProps {
  tourId: string;
  tourName: string;
  tourDate?: string | null;
  entries: PacklistEntry[];
  childItemMap: Map<string, ItemRow[]>;
  childFeedbackMap: Map<string, { rating: number | null; note: string | null; is_checked: boolean }>;
  garageItems: ItemRow[];
  isOwner: boolean;
  presetBadgeMap?: Map<string, string>;
  bikeSetupBike?: ItemRow;
  bikeSetupBikeChecked?: boolean;
}

const NOTE_PREVIEW_LEN = 100;

export function TourPacklist({
  tourId,
  tourName,
  tourDate,
  entries,
  childItemMap,
  childFeedbackMap,
  garageItems,
  isOwner,
  presetBadgeMap,
  bikeSetupBike,
  bikeSetupBikeChecked = false,
}: TourPacklistProps) {
  const [removing, setRemoving] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const e of entries) if (e.is_checked) s.add(e.item.id);
    for (const [id, f] of childFeedbackMap) if (f.is_checked) s.add(id);
    if (bikeSetupBikeChecked && bikeSetupBike) s.add(bikeSetupBike.id);
    return s;
  });

  // Bike-Setup data
  const bikeEntry = entries.find((e) => e.item.category === "Bike");
  const activeBike = bikeSetupBike ?? bikeEntry?.item ?? null;
  const bikeChildren = activeBike ? (childItemMap.get(activeBike.id) ?? []) : [];
  const presetName = activeBike ? presetBadgeMap?.get(activeBike.id) : undefined;

  // Payload sections
  const gearEntries = entries.filter((e) => e.item.category === "Gear");
  const clothingEntries = entries.filter((e) => e.item.category === "Clothing");

  // Weight computation (treat null weight_g as 0 for sums)
  const bikeSetupWeightG =
    (activeBike?.weight_g ?? 0) +
    bikeChildren.reduce((s, c) => s + (c.weight_g ?? 0), 0);
  const payloadWeightG =
    gearEntries.reduce((s, e) => s + (e.item.weight_g ?? 0), 0) +
    clothingEntries.reduce((s, e) => s + (e.item.weight_g ?? 0), 0);
  const totalWeightG = bikeSetupWeightG + payloadWeightG;
  const showWeights =
    activeBike?.weight_g !== null ||
    bikeChildren.some((c) => c.weight_g !== null) ||
    gearEntries.some((e) => e.item.weight_g !== null) ||
    clothingEntries.some((e) => e.item.weight_g !== null);

  // Progress counts
  const allItemIds = [
    ...(activeBike ? [activeBike.id] : []),
    ...bikeChildren.map((c) => c.id),
    ...gearEntries.map((e) => e.item.id),
    ...clothingEntries.map((e) => e.item.id),
  ];
  const checkedCount = allItemIds.filter((id) => checkedIds.has(id)).length;
  const totalCount = allItemIds.length;

  const packlistItemIds = new Set(entries.map((e) => e.item.id));

  function toggleNote(id: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCheck(itemId: string, checked: boolean) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
    startTransition(async () => {
      await toggleCheckOffAction(tourId, itemId, checked);
    });
  }

  function handleRemove(itemId: string) {
    setRemoveError(null);
    setRemoving(itemId);
    startTransition(async () => {
      const result = await removeTourItemAction(tourId, itemId);
      setRemoving(null);
      if (result.error) setRemoveError(result.error);
    });
  }

  async function handlePdfExport() {
    setIsPdfLoading(true);
    try {
      const [{ pdf }, { TourPacklistPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./TourPacklistPDF"),
      ]);
      const doc = React.createElement(TourPacklistPDF, {
        tourName,
        tourDate,
        presetName,
        bikeItem: activeBike,
        bikeChildren,
        gearItems: gearEntries.map((e) => e.item),
        clothingItems: clothingEntries.map((e) => e.item),
        bikeSetupWeightG,
        payloadWeightG,
        totalWeightG,
        showWeights: showWeights ?? false,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(doc as any).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const slug = tourName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const date = tourDate ? tourDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `packliste-${slug}-${date}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[TourPacklist] PDF export failed:", err);
    } finally {
      setIsPdfLoading(false);
    }
  }

  return (
    <section aria-labelledby="packlist-heading" className="space-y-4">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">Packliste</p>
          <h2 id="packlist-heading" className="text-lg font-semibold text-cockpit-text">
            {totalCount > 0 ? `${checkedCount} / ${totalCount} abgehakt` : "Keine Items"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={totalCount === 0 || isPdfLoading}
            onClick={handlePdfExport}
            className="gap-1.5"
            aria-label="Packliste als PDF exportieren"
          >
            {isPdfLoading ? (
              <Loader2 size={14} strokeWidth={2} className="animate-spin" aria-hidden />
            ) : (
              <FileDown size={14} strokeWidth={1.75} aria-hidden />
            )}
            PDF
          </Button>
          {isOwner && (
            <ItemPickerSheet
              tourId={tourId}
              garageItems={garageItems}
              packlistItemIds={packlistItemIds}
            />
          )}
        </div>
      </header>

      {/* Weight breakdown bar */}
      {showWeights && (
        <div
          className="flex flex-wrap items-center gap-4 rounded-md border border-cockpit-border bg-cockpit-bg/60 px-4 py-3"
          role="region"
          aria-label="Gewichtsübersicht"
        >
          <div className="flex items-center gap-2 text-cockpit-muted shrink-0">
            <Scale size={13} strokeWidth={1.75} aria-hidden />
            <span className="text-[10px] uppercase tracking-widest">Gewicht</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            {activeBike !== null && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-cockpit-muted/70">Bike-Setup</p>
                <p className="tabular-nums text-sm font-semibold text-cockpit-text">
                  {formatWeight3dp(bikeSetupWeightG)}
                </p>
              </div>
            )}
            {(gearEntries.length > 0 || clothingEntries.length > 0) && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-cockpit-muted/70">Zuladung</p>
                <p className="tabular-nums text-sm font-semibold text-cockpit-text">
                  {formatWeight3dp(payloadWeightG)}
                </p>
              </div>
            )}
            {activeBike !== null && (gearEntries.length > 0 || clothingEntries.length > 0) && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-cockpit-muted/70">Gesamt</p>
                <p className="tabular-nums text-sm font-semibold text-petrol-300">
                  {formatWeight3dp(totalWeightG)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {removeError && (
        <p role="alert" className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {removeError}
        </p>
      )}

      {/* Three permanent sections */}
      <div className="space-y-6">
        {/* ── Bike-Setup ── */}
        <PacklistSection
          heading="Bike-Setup"
          Icon={Bike}
          badge={presetName ? `Preset: ${presetName}` : undefined}
        >
          {activeBike ? (
            <>
              <PacklistItemRow
                tourId={tourId}
                item={activeBike}
                rating={bikeEntry?.rating ?? null}
                note={bikeEntry?.note ?? null}
                isChecked={checkedIds.has(activeBike.id)}
                isOwner={isOwner}
                removable={false}
                isRemoving={false}
                expandedNotes={expandedNotes}
                toggleNote={toggleNote}
                onCheck={handleCheck}
                onRemove={() => {}}
              />
              {bikeChildren.map((child) => {
                const fb = childFeedbackMap.get(child.id) ?? { rating: null, note: null, is_checked: false };
                return (
                  <PacklistChildRow
                    key={child.id}
                    tourId={tourId}
                    item={child}
                    rating={fb.rating}
                    note={fb.note}
                    isChecked={checkedIds.has(child.id)}
                    isOwner={isOwner}
                    expandedNotes={expandedNotes}
                    toggleNote={toggleNote}
                    onCheck={handleCheck}
                  />
                );
              })}
            </>
          ) : (
            <p className="py-6 text-center text-sm text-cockpit-muted">
              Kein Bike-Preset ausgewählt.{" "}
              {isOwner && (
                <span className="text-cockpit-muted/60">
                  Bearbeite die Tour um ein Preset zuzuweisen.
                </span>
              )}
            </p>
          )}
        </PacklistSection>

        {/* ── Equipment ── */}
        <PacklistSection
          heading="Equipment"
          Icon={Package}
        >
          {gearEntries.length === 0 ? (
            <p className="py-6 text-center text-sm text-cockpit-muted">
              {isOwner ? "Noch kein Equipment hinzugefügt." : "Kein Equipment auf der Packliste."}
            </p>
          ) : (
            gearEntries.map(({ tourItemId, item, rating, note }) => (
              <PacklistItemRow
                key={tourItemId}
                tourId={tourId}
                item={item}
                rating={rating}
                note={note}
                isChecked={checkedIds.has(item.id)}
                isOwner={isOwner}
                removable={isOwner}
                isRemoving={removing === item.id && isPending}
                expandedNotes={expandedNotes}
                toggleNote={toggleNote}
                onCheck={handleCheck}
                onRemove={() => handleRemove(item.id)}
              />
            ))
          )}
        </PacklistSection>

        {/* ── Bekleidung ── */}
        <PacklistSection
          heading="Bekleidung"
          Icon={Shirt}
        >
          {clothingEntries.length === 0 ? (
            <p className="py-6 text-center text-sm text-cockpit-muted">
              {isOwner ? "Noch keine Bekleidung hinzugefügt." : "Keine Bekleidung auf der Packliste."}
            </p>
          ) : (
            clothingEntries.map(({ tourItemId, item, rating, note }) => (
              <PacklistItemRow
                key={tourItemId}
                tourId={tourId}
                item={item}
                rating={rating}
                note={note}
                isChecked={checkedIds.has(item.id)}
                isOwner={isOwner}
                removable={isOwner}
                isRemoving={removing === item.id && isPending}
                expandedNotes={expandedNotes}
                toggleNote={toggleNote}
                onCheck={handleCheck}
                onRemove={() => handleRemove(item.id)}
              />
            ))
          )}
        </PacklistSection>
      </div>
    </section>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────

interface PacklistSectionProps {
  heading: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; "aria-hidden"?: boolean }>;
  badge?: string;
  children: React.ReactNode;
}

function PacklistSection({ heading, Icon, badge, children }: PacklistSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={12} strokeWidth={1.75} className="text-cockpit-muted" aria-hidden />
        <h3 className="text-[11px] uppercase tracking-widest font-semibold text-cockpit-muted">
          {heading}
        </h3>
        {badge && (
          <Badge
            variant="outline"
            className="shrink-0 border-amber-700/60 bg-amber-950/30 px-1.5 py-0 text-[9px] font-normal text-amber-300"
          >
            {badge}
          </Badge>
        )}
      </div>
      <div className="rounded-lg border border-cockpit-border overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ── Main item row ────────────────────────────────────────────────────────────

interface PacklistItemRowProps {
  tourId: string;
  item: ItemRow;
  rating: number | null;
  note: string | null;
  isChecked: boolean;
  isOwner: boolean;
  removable: boolean;
  isRemoving: boolean;
  expandedNotes: Set<string>;
  toggleNote: (id: string) => void;
  onCheck: (itemId: string, checked: boolean) => void;
  onRemove: () => void;
}

function PacklistItemRow({
  tourId,
  item,
  rating,
  note,
  isChecked,
  isOwner,
  removable,
  isRemoving,
  expandedNotes,
  toggleNote,
  onCheck,
  onRemove,
}: PacklistItemRowProps) {
  const config = CATEGORY_CONFIG[item.category];
  const Icon = config.icon;
  const itemLabel = `${item.brand}${item.model ? ` ${item.model}` : ""}`;
  const hasFeedback = rating !== null || (note !== null && note.length > 0);
  const isNoteExpanded = expandedNotes.has(item.id);

  return (
    <div className="border-b border-cockpit-border/40 last:border-b-0 bg-cockpit-surface">
      <div className="flex items-center gap-3 px-3 py-2.5">
        {isOwner && (
          <Checkbox
            checked={isChecked}
            onCheckedChange={(v) => onCheck(item.id, v === true)}
            aria-label={`${itemLabel} abhaken`}
            id={`check-${item.id}`}
            className="shrink-0"
          />
        )}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-petrol-800/60 bg-petrol-950/40 text-petrol-300">
          <Icon size={17} strokeWidth={1.75} aria-hidden />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/inventory/${item.id}`}
              className={`text-sm font-medium transition-colors truncate ${
                isChecked ? "line-through text-cockpit-muted/60" : "text-cockpit-text hover:text-petrol-300"
              }`}
              aria-label={`${itemLabel} in der Garage ansehen`}
            >
              {itemLabel}
            </Link>
          </div>
          <p className="text-xs text-cockpit-muted flex items-center gap-2">
            <span>{config.label}</span>
            {item.weight_g !== null && (
              <span className="tabular-nums">{formatWeight(item.weight_g)}</span>
            )}
          </p>
        </div>
        {removable && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isRemoving}
            onClick={onRemove}
            aria-label={`${itemLabel} von Packliste entfernen`}
            className="shrink-0 h-8 w-8 p-0 text-cockpit-muted hover:text-red-400"
          >
            <Trash2 size={14} strokeWidth={1.75} aria-hidden />
          </Button>
        )}
      </div>

      {(hasFeedback || isOwner) && (
        <div className="border-t border-cockpit-border/30 bg-cockpit-bg/20 px-3 py-2 flex items-start justify-between gap-3 min-h-[2.25rem]">
          <NoteDisplay
            note={note}
            rating={rating}
            isExpanded={isNoteExpanded}
            onToggle={() => toggleNote(item.id)}
            hasFeedback={hasFeedback}
            isOwner={isOwner}
          />
          {isOwner && (
            <FeedbackSheet
              tourId={tourId}
              itemId={item.id}
              itemLabel={itemLabel}
              initialRating={rating}
              initialNote={note}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Child (component) row ────────────────────────────────────────────────────

interface PacklistChildRowProps {
  tourId: string;
  item: ItemRow;
  rating: number | null;
  note: string | null;
  isChecked: boolean;
  isOwner: boolean;
  expandedNotes: Set<string>;
  toggleNote: (id: string) => void;
  onCheck: (itemId: string, checked: boolean) => void;
}

function PacklistChildRow({
  tourId,
  item,
  rating,
  note,
  isChecked,
  isOwner,
  expandedNotes,
  toggleNote,
  onCheck,
}: PacklistChildRowProps) {
  const config = CATEGORY_CONFIG[item.category];
  const ChildIcon = config.icon;
  const childLabel = `${item.brand}${item.model ? ` ${item.model}` : ""}`;
  const hasFeedback = rating !== null || (note !== null && note.length > 0);
  const isNoteExpanded = expandedNotes.has(item.id);

  return (
    <div className="border-b border-cockpit-border/30 last:border-b-0 bg-cockpit-bg/30">
      <div className="flex items-center gap-2.5 px-3 py-2">
        {isOwner && (
          <Checkbox
            checked={isChecked}
            onCheckedChange={(v) => onCheck(item.id, v === true)}
            aria-label={`${childLabel} abhaken`}
            id={`check-${item.id}`}
            className="shrink-0 scale-90 opacity-80"
          />
        )}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center opacity-60">
          <ChildIcon size={13} strokeWidth={1.75} aria-hidden className="text-petrol-400" />
        </span>
        <Link
          href={`/inventory/${item.id}`}
          className={`flex-1 min-w-0 text-xs transition-colors truncate ${
            isChecked
              ? "line-through text-cockpit-muted/40"
              : "text-cockpit-muted hover:text-petrol-300"
          }`}
          aria-label={`${childLabel} im Lager ansehen`}
        >
          {childLabel}
        </Link>
        {item.weight_g !== null && (
          <span className="text-xs tabular-nums text-cockpit-muted shrink-0">
            {formatWeight(item.weight_g)}
          </span>
        )}
      </div>

      {(hasFeedback || isOwner) && (
        <div className="flex items-start justify-between gap-2 pl-[3.25rem] pr-3 pb-2">
          <NoteDisplay
            note={note}
            rating={rating}
            isExpanded={isNoteExpanded}
            onToggle={() => toggleNote(item.id)}
            hasFeedback={hasFeedback}
            isOwner={isOwner}
          />
          {isOwner && (
            <FeedbackSheet
              tourId={tourId}
              itemId={item.id}
              itemLabel={childLabel}
              initialRating={rating}
              initialNote={note}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Note display helper ──────────────────────────────────────────────────────

function NoteDisplay({
  note,
  rating,
  isExpanded,
  onToggle,
  hasFeedback,
  isOwner,
}: {
  note: string | null;
  rating: number | null;
  isExpanded: boolean;
  onToggle: () => void;
  hasFeedback: boolean;
  isOwner: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0 flex-1">
      {rating !== null && <StarDisplay rating={rating} size={13} />}
      {note && (
        <div className="text-xs text-cockpit-muted">
          <span>
            {isExpanded || note.length <= NOTE_PREVIEW_LEN
              ? note
              : `${note.slice(0, NOTE_PREVIEW_LEN)}…`}
          </span>
          {note.length > NOTE_PREVIEW_LEN && (
            <button
              type="button"
              onClick={onToggle}
              className="ml-1.5 inline-flex items-center gap-0.5 text-petrol-400 hover:text-petrol-300 transition-colors"
              aria-label={isExpanded ? "Notiz einklappen" : "Notiz vollständig anzeigen"}
            >
              {isExpanded ? (
                <ChevronUp size={12} strokeWidth={1.75} aria-hidden />
              ) : (
                <ChevronDown size={12} strokeWidth={1.75} aria-hidden />
              )}
            </button>
          )}
        </div>
      )}
      {!hasFeedback && isOwner && (
        <span className="text-[11px] italic text-cockpit-muted/50">Kein Feedback</span>
      )}
    </div>
  );
}
