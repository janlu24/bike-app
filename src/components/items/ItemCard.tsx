"use client";

import { CATEGORY_CONFIG } from "@/lib/items/categories";
import { cn } from "@/lib/utils";
import { formatWeight } from "@/lib/utils/weight";
import type { ItemRow } from "@/types/supabase";
import { ChevronDown, Eye, EyeOff, Link2, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ItemCardProps {
  item: ItemRow;
  parent?: { id: string; brand: string; model: string | null } | null;
}

const COLLAPSED_LIMIT = 3;

export function ItemCard({ item, parent }: ItemCardProps) {
  const config = CATEGORY_CONFIG[item.category];
  const Icon = config.icon;
  const allEntries = Object.entries(
    (item.metadata as Record<string, unknown>) ?? {}
  );
  const overflow = allEntries.length > COLLAPSED_LIMIT;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? allEntries : allEntries.slice(0, COLLAPSED_LIMIT);
  const VisibilityIcon = item.is_public ? Eye : EyeOff;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-cockpit-surface shadow-cockpit transition-colors",
        "border-cockpit-border hover:border-petrol-700"
      )}
    >
      {item.image_url && (
        <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-cockpit-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image_url}
            alt={`${item.brand ?? ""} ${item.model ?? ""}`.trim()}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cockpit-surface/80 via-petrol-950/20 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-petrol-500/60"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-md border border-petrol-800/60 bg-petrol-950/40 text-petrol-300"
            >
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-cockpit-muted">
                {config.label}
              </p>
              <h3 className="text-sm font-semibold text-cockpit-text">
                {item.brand}
              </h3>
              <p className="text-xs text-cockpit-muted">{item.model}</p>
            </div>
          </div>
          <div
            className="flex items-center gap-1 text-cockpit-muted"
            title={item.is_public ? "Öffentlich sichtbar" : "Privat"}
            aria-label={item.is_public ? "Öffentlich" : "Privat"}
          >
            <VisibilityIcon size={14} strokeWidth={1.75} aria-hidden />
          </div>
        </header>

        {parent && (
          <Link
            href={`/garage?bikeId=${parent.id}`}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-petrol-800/60 bg-petrol-950/40 px-2.5 py-0.5 text-[11px] text-petrol-200 transition-colors hover:border-petrol-500 hover:shadow-[0_0_8px_rgba(51,159,167,0.4)]"
            title="Build dieses Bikes anzeigen"
          >
            <Link2 size={11} strokeWidth={1.75} aria-hidden />
            <span className="text-cockpit-muted">Verbaut an:</span>
            <span className="font-medium">
              {parent.brand}
              {parent.model ? ` ${parent.model}` : ""}
            </span>
          </Link>
        )}

        {(item.weight_g !== null || allEntries.length > 0) && (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-cockpit-border pt-3 text-xs">
            {item.weight_g !== null && (
              <div className="col-span-2 flex items-baseline justify-between">
                <dt className="uppercase tracking-widest text-cockpit-muted">
                  Gewicht
                </dt>
                <dd className="text-cockpit-text">
                  {formatWeight(item.weight_g)}
                </dd>
              </div>
            )}
            {visible.map(([key, value]) => (
              <div
                key={key}
                className="col-span-2 flex items-baseline justify-between gap-2"
              >
                <dt className="truncate text-cockpit-muted">{key}</dt>
                <dd className="truncate text-right text-cockpit-text">
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {overflow && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center justify-center gap-1 self-start rounded-md border border-cockpit-border px-2 py-1 text-[11px] uppercase tracking-widest text-cockpit-muted transition-colors hover:border-petrol-600 hover:text-petrol-300"
          >
            <ChevronDown
              size={12}
              strokeWidth={1.75}
              aria-hidden
              className={cn(
                "transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
            {expanded
              ? "Weniger"
              : `Mehr anzeigen (+${allEntries.length - COLLAPSED_LIMIT})`}
          </button>
        )}

        <footer className="mt-auto flex justify-end">
          <Link
            href={`/garage/${item.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md border border-cockpit-border px-2.5 py-1 text-xs text-cockpit-muted transition-colors hover:border-petrol-600 hover:text-petrol-300"
          >
            <Pencil size={12} strokeWidth={1.75} aria-hidden />
            Bearbeiten
          </Link>
        </footer>
      </div>
    </article>
  );
}
