import { CategoryTile } from "@/components/dashboard/CategoryTile";
import { Button } from "@/components/ui/button";
import type { CategoryCounts } from "@/lib/items/aggregate";
import { ITEM_CATEGORIES } from "@/lib/items/categories";
import { ArrowRight, Plus, Shield } from "lucide-react";
import Link from "next/link";

interface MemberDashboardProps {
  username: string | null;
  counts: CategoryCounts;
}

export function MemberDashboard({ username, counts }: MemberDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-widest text-petrol-400">
            {username ? `@${username}` : "Cockpit"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Willkommen im{" "}
            <span className="text-petrol-400">Cockpit</span>
          </h1>
          <p className="mt-1 text-sm text-cockpit-muted">
            Dein digitaler Zwilling. Präzise. Privat. Teilbar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="text-cockpit-muted hover:text-cockpit-text">
            <Link href="/inventory" aria-label="Zum Lager">
              <ArrowRight size={16} strokeWidth={2} aria-hidden />
              Zum Lager
            </Link>
          </Button>
          <Link
            href="/inventory/new"
            aria-label="Neues Item anlegen"
            className="inline-flex items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-3.5 py-2 text-sm font-medium text-white shadow-cockpit transition-colors hover:bg-petrol-500"
          >
            <Plus size={16} strokeWidth={2} aria-hidden />
            Neues Item
          </Link>
        </div>
      </header>

      {/* Category Grid */}
      <section aria-label="Kategorien">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ITEM_CATEGORIES.map((category) => (
            <CategoryTile
              key={category}
              category={category}
              count={counts.byCategory[category]}
            />
          ))}
        </div>
      </section>

      {/* Summary row */}
      <section
        aria-label="Zusammenfassung"
        className="grid grid-cols-2 gap-3"
      >
        <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-cockpit-muted">
            Bikes gesamt
          </p>
          <p
            aria-label={`${counts.byCategory.Bike} Bikes`}
            className="mt-1 font-mono text-3xl font-semibold tabular-nums text-cockpit-text"
          >
            {counts.byCategory.Bike}
          </p>
        </div>
        <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-cockpit-muted">
            Items gesamt
          </p>
          <p
            aria-label={`${counts.total} Items gesamt`}
            className="mt-1 font-mono text-3xl font-semibold tabular-nums text-cockpit-text"
          >
            {counts.total}
          </p>
        </div>
      </section>

      {/* Privacy Notice */}
      <section
        aria-label="Datenschutz"
        className="rounded-lg border border-cockpit-border bg-cockpit-surface p-4"
      >
        <div className="flex items-start gap-3">
          <Shield
            size={16}
            strokeWidth={1.75}
            aria-hidden
            className="mt-0.5 shrink-0 text-petrol-400"
          />
          <div>
            <p className="text-xs font-medium text-cockpit-text">
              Datenschutz by Default
            </p>
            <p className="mt-0.5 text-xs text-cockpit-muted">
              Alle Items sind privat. Du entscheidest, was du teilst.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
