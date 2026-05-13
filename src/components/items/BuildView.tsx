"use client";

import { useTransition, useState } from "react";
import { unlinkComponentFromBikeAction } from "@/app/(app)/garage/actions";
import type { PresetApplyDiff } from "@/app/(app)/garage/actions";
import { CATEGORY_CONFIG } from "@/lib/items/categories";
import type { BuildSummary } from "@/lib/items/build";
import { formatWeight } from "@/lib/utils/weight";
import type { BikePresetWithItems, ItemRow } from "@/types/supabase";
import { Eye, EyeOff, Scale, Unlink, Wrench } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "./EmptyState";
import { ItemCard } from "./ItemCard";
import { ItemPickerSheet } from "./ItemPickerSheet";
import { PresetPanel } from "./PresetPanel";

interface BuildViewProps {
  build: BuildSummary;
  availableParts: ItemRow[];
  initialPresets: BikePresetWithItems[];
}

export function BuildView({ build: initialBuild, availableParts: initialAvailable, initialPresets }: BuildViewProps) {
  const [build, setBuild] = useState(initialBuild);
  const [availableParts, setAvailableParts] = useState(initialAvailable);

  const { bike, parts, totalWeight, partCount, hasUnknownWeight } = build;
  const bikeConfig = CATEGORY_CONFIG[bike.category];
  const BikeIcon = bikeConfig.icon;
  const VisibilityIcon = bike.is_public ? Eye : EyeOff;

  function handleLinked(itemId: string) {
    const linked = availableParts.find((p) => p.id === itemId);
    if (!linked) return;
    setBuild((prev) => ({
      ...prev,
      parts: [...prev.parts, { ...linked, parent_id: bike.id }],
      partCount: prev.partCount + 1,
      totalWeight: linked.weight_g !== null ? prev.totalWeight + linked.weight_g : prev.totalWeight,
      hasUnknownWeight: prev.hasUnknownWeight || linked.weight_g === null,
    }));
    setAvailableParts((prev) => prev.filter((p) => p.id !== itemId));
  }

  function handleUnlinked(itemId: string) {
    const removed = parts.find((p) => p.id === itemId);
    if (!removed) return;
    setBuild((prev) => {
      const nextParts = prev.parts.filter((p) => p.id !== itemId);
      const nextHasUnknown = nextParts.some((p) => p.weight_g === null) || bike.weight_g === null;
      return {
        ...prev,
        parts: nextParts,
        partCount: prev.partCount - 1,
        totalWeight: removed.weight_g !== null ? prev.totalWeight - removed.weight_g : prev.totalWeight,
        hasUnknownWeight: nextHasUnknown,
      };
    });
    setAvailableParts((prev) => [...prev, { ...removed, parent_id: null }]);
  }

  function handlePresetApplied({ toUnlink, toLink, conflicts }: PresetApplyDiff) {
    setBuild((prev) => {
      const unlinkedIds = new Set(toUnlink.map((i) => i.id));
      const partsAfterUnlink = prev.parts.filter((p) => !unlinkedIds.has(p.id));
      const partsAlreadyLinked = new Set(partsAfterUnlink.map((p) => p.id));
      const newParts = [
        ...toLink,
        ...conflicts,
      ].filter((i) => !partsAlreadyLinked.has(i.id)).map((i) => ({ ...i, parent_id: bike.id }));
      const nextParts = [...partsAfterUnlink, ...newParts];
      const nextWeight = (bike.weight_g ?? 0) + nextParts.reduce((sum, p) => sum + (p.weight_g ?? 0), 0);
      const nextHasUnknown = nextParts.some((p) => p.weight_g === null) || bike.weight_g === null;
      return {
        ...prev,
        parts: nextParts,
        partCount: nextParts.length,
        totalWeight: nextWeight,
        hasUnknownWeight: nextHasUnknown,
      };
    });
    setAvailableParts((prev) => {
      const nowLinkedIds = new Set([...toLink, ...conflicts].map((i) => i.id));
      return [
        ...prev.filter((p) => !nowLinkedIds.has(p.id)),
        ...toUnlink.map((i) => ({ ...i, parent_id: null })),
      ];
    });
  }

  return (
    <div className="space-y-5">
      <article className="overflow-hidden rounded-lg border border-petrol-700 bg-cockpit-surface shadow-[0_0_20px_rgba(51,159,167,0.15)]">
        {bike.image_url && (
          <div className="relative aspect-[21/9] w-full overflow-hidden border-b border-cockpit-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bike.image_url}
              alt={`${bike.brand} ${bike.model ?? ""}`.trim()}
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cockpit-surface/90 via-petrol-950/30 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-petrol-500/80"
            />
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-11 w-11 items-center justify-center rounded-md border border-petrol-700 bg-petrol-950/60 text-petrol-300"
            >
              <BikeIcon size={22} strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-petrol-300">
                Build · {bikeConfig.label}
              </p>
              <h1 className="text-xl font-semibold tracking-tight">
                {bike.brand}{" "}
                <span className="text-petrol-300">{bike.model}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full border border-cockpit-border px-2.5 py-0.5 text-[11px] text-cockpit-muted"
              title={bike.is_public ? "Öffentlich sichtbar" : "Privat"}
            >
              <VisibilityIcon size={11} strokeWidth={1.75} aria-hidden />
              {bike.is_public ? "Öffentlich" : "Privat"}
            </span>
            <Link
              href={`/garage/${bike.id}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-cockpit-border px-2.5 py-1 text-xs text-cockpit-muted transition-colors hover:border-petrol-600 hover:text-petrol-300"
            >
              <Eye size={12} strokeWidth={1.75} aria-hidden />
              Ansehen
            </Link>
          </div>
        </div>
      </article>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          icon={<Scale size={14} strokeWidth={1.75} aria-hidden />}
          label="Gesamtgewicht"
          value={
            totalWeight > 0 || !hasUnknownWeight
              ? formatWeight(totalWeight)
              : "–"
          }
          hint={
            hasUnknownWeight
              ? "Einige Gewichte fehlen – Summe ist ein Mindestwert."
              : undefined
          }
          approximate={hasUnknownWeight && totalWeight > 0}
        />
        <Stat
          icon={<Wrench size={14} strokeWidth={1.75} aria-hidden />}
          label="Verbaut"
          value={`${partCount} ${partCount === 1 ? "Item" : "Items"}`}
        />
        <Stat
          icon={<BikeIcon size={14} strokeWidth={1.75} aria-hidden />}
          label="Bike-Gewicht"
          value={formatWeight(bike.weight_g)}
        />
      </dl>

      <section className="space-y-3">
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wrench
              size={14}
              strokeWidth={1.75}
              className="text-petrol-400"
              aria-hidden
            />
            <h2 className="text-[11px] uppercase tracking-widest text-cockpit-muted">
              Stückliste
            </h2>
            <span className="text-[11px] text-cockpit-muted">
              · {partCount}
            </span>
          </div>
          <ItemPickerSheet
            bikeId={bike.id}
            availableParts={availableParts}
            onLinked={handleLinked}
          />
        </header>

        {parts.length === 0 ? (
          <EmptyState
            filtered
            hint="Noch keine Komponenten verbaut. Füge Parts über 'Komponente hinzufügen' hinzu."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parts.map((part) => (
              <ItemCard
                key={part.id}
                item={part}
                headerActions={
                  <UnlinkButton itemId={part.id} onUnlinked={handleUnlinked} />
                }
              />
            ))}
          </div>
        )}
      </section>

      <PresetPanel
        bikeId={bike.id}
        initialPresets={initialPresets}
        currentPartIds={parts.map((p) => p.id)}
        onPresetApplied={handlePresetApplied}
      />
    </div>
  );
}

function UnlinkButton({
  itemId,
  onUnlinked,
}: {
  itemId: string;
  onUnlinked: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleUnlink() {
    setError(null);
    startTransition(async () => {
      const result = await unlinkComponentFromBikeAction(itemId);
      if ("error" in result) {
        setError(result.error);
      } else {
        onUnlinked(itemId);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleUnlink}
      disabled={isPending}
      title={error ?? "Vom Bike lösen"}
      aria-label="Komponente vom Bike lösen"
      className="flex h-5 w-5 items-center justify-center rounded border border-cockpit-border/60 text-cockpit-muted/60 transition-colors hover:border-red-800/60 hover:text-red-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-petrol-500 disabled:opacity-50"
    >
      {isPending ? (
        <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
      ) : (
        <Unlink size={10} strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  approximate,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  approximate?: boolean;
}) {
  return (
    <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-3">
      <div className="flex items-center gap-1.5 text-cockpit-muted">
        {icon}
        <dt className="text-[10px] uppercase tracking-widest">{label}</dt>
      </div>
      <dd className="mt-1 text-xl text-cockpit-text">
        {approximate && (
          <span aria-hidden className="mr-0.5 text-petrol-400">
            ≥
          </span>
        )}
        {value}
      </dd>
      {hint && <p className="mt-1 text-[11px] text-cockpit-muted">{hint}</p>}
    </div>
  );
}
