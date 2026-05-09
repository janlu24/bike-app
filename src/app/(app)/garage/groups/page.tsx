import { GroupCard } from "@/components/groups/GroupCard";
import { CATEGORY_CONFIG, ITEM_CATEGORIES } from "@/lib/items/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GroupRow, ItemCategory } from "@/types/supabase";
import { LayoutTemplate, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gruppen · Setup Registry",
};

export default async function GroupsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: rawGroups } = await supabase
    .from("item_groups")
    .select("id, category, name, property_keys, created_at, updated_at, user_id")
    .eq("user_id", user.id)
    .order("category")
    .order("name");

  const groups = (rawGroups ?? []) as GroupRow[];

  // Count linked items per group.
  const groupIds = groups.map((g) => g.id);
  const countByGroup: Record<string, number> = {};

  if (groupIds.length > 0) {
    const { data: linkedItems } = await supabase
      .from("items")
      .select("group_id")
      .eq("user_id", user.id)
      .in("group_id", groupIds);

    for (const item of linkedItems ?? []) {
      if (item.group_id) {
        countByGroup[item.group_id] = (countByGroup[item.group_id] ?? 0) + 1;
      }
    }
  }

  const grouped = ITEM_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = groups.filter((g) => g.category === cat);
      return acc;
    },
    {} as Record<ItemCategory, GroupRow[]>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Link
              href="/garage"
              className="inline-flex items-center gap-1 rounded-md border border-cockpit-border px-2.5 py-1 text-xs text-cockpit-muted hover:text-cockpit-text"
            >
              ← Zur Garage
            </Link>
          </div>
          <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
            Garage · Gruppen
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Deine <span className="text-petrol-400">Gruppen</span>
          </h1>
          <p className="mt-1 text-sm text-cockpit-muted">
            {groups.length === 0
              ? "Noch keine Gruppen angelegt."
              : `${groups.length} Gruppe${groups.length === 1 ? "" : "n"}`}
          </p>
        </div>
        <Link
          href="/garage/groups/new"
          className="inline-flex items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-3.5 py-2 text-sm font-medium text-white shadow-cockpit transition-colors hover:bg-petrol-500"
        >
          <Plus size={16} strokeWidth={2} aria-hidden />
          Neue Gruppe
        </Link>
      </header>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-cockpit-border bg-cockpit-surface/40 py-16 text-center">
          <LayoutTemplate
            size={32}
            strokeWidth={1.25}
            className="mb-3 text-cockpit-muted"
            aria-hidden
          />
          <p className="text-sm font-medium text-cockpit-text">
            Noch keine Gruppen
          </p>
          <p className="mt-1 max-w-xs text-xs text-cockpit-muted">
            Erstelle eine Gruppe, um gleichartige Items mit denselben Eigenschaften vergleichbar zu machen.
          </p>
          <Link
            href="/garage/groups/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-petrol-700 bg-petrol-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-petrol-500"
          >
            <Plus size={13} strokeWidth={2} aria-hidden />
            Erste Gruppe anlegen
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {ITEM_CATEGORIES.map((cat) => {
            const catGroups = grouped[cat];
            if (catGroups.length === 0) return null;
            const config = CATEGORY_CONFIG[cat];
            const CatIcon = config.icon;
            return (
              <section key={cat} className="space-y-3">
                <header className="flex items-center gap-2">
                  <CatIcon
                    size={14}
                    strokeWidth={1.75}
                    className="text-petrol-400"
                    aria-hidden
                  />
                  <h2 className="text-[11px] uppercase tracking-widest text-cockpit-muted">
                    {config.label}
                  </h2>
                  <span className="text-[11px] text-cockpit-muted">
                    · {catGroups.length}
                  </span>
                </header>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {catGroups.map((grp) => (
                    <GroupCard
                      key={grp.id}
                      id={grp.id}
                      name={grp.name}
                      category={grp.category}
                      keyCount={grp.property_keys.length}
                      linkedItemCount={countByGroup[grp.id] ?? 0}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
