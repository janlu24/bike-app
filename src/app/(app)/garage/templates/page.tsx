import { TemplateCard } from "@/components/templates/TemplateCard";
import { CATEGORY_CONFIG, ITEM_CATEGORIES } from "@/lib/items/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ItemCategory, TemplateRow } from "@/types/supabase";
import { LayoutTemplate, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vorlagen · Setup Registry",
};

export default async function TemplatesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: rawTemplates } = await supabase
    .from("item_templates")
    .select("id, category, name, property_keys, created_at, updated_at, user_id")
    .eq("user_id", user.id)
    .order("category")
    .order("name");

  const templates = (rawTemplates ?? []) as TemplateRow[];

  // Count linked items per template.
  const templateIds = templates.map((t) => t.id);
  const countByTemplate: Record<string, number> = {};

  if (templateIds.length > 0) {
    const { data: linkedItems } = await supabase
      .from("items")
      .select("template_id")
      .eq("user_id", user.id)
      .in("template_id", templateIds);

    for (const item of linkedItems ?? []) {
      if (item.template_id) {
        countByTemplate[item.template_id] =
          (countByTemplate[item.template_id] ?? 0) + 1;
      }
    }
  }

  const grouped = ITEM_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = templates.filter((t) => t.category === cat);
      return acc;
    },
    {} as Record<ItemCategory, TemplateRow[]>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
            Garage · Vorlagen
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Deine <span className="text-petrol-400">Vorlagen</span>
          </h1>
          <p className="mt-1 text-sm text-cockpit-muted">
            {templates.length === 0
              ? "Noch keine Vorlagen angelegt."
              : `${templates.length} Vorlage${templates.length === 1 ? "" : "n"}`}
          </p>
        </div>
        <Link
          href="/garage/templates/new"
          className="inline-flex items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-3.5 py-2 text-sm font-medium text-white shadow-cockpit transition-colors hover:bg-petrol-500"
        >
          <Plus size={16} strokeWidth={2} aria-hidden />
          Neue Vorlage
        </Link>
      </header>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-cockpit-border bg-cockpit-surface/40 py-16 text-center">
          <LayoutTemplate
            size={32}
            strokeWidth={1.25}
            className="mb-3 text-cockpit-muted"
            aria-hidden
          />
          <p className="text-sm font-medium text-cockpit-text">
            Noch keine Vorlagen
          </p>
          <p className="mt-1 max-w-xs text-xs text-cockpit-muted">
            Erstelle eine Vorlage, um gleichartige Items mit denselben Eigenschaften vergleichbar zu machen.
          </p>
          <Link
            href="/garage/templates/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-petrol-700 bg-petrol-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-petrol-500"
          >
            <Plus size={13} strokeWidth={2} aria-hidden />
            Erste Vorlage anlegen
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {ITEM_CATEGORIES.map((cat) => {
            const group = grouped[cat];
            if (group.length === 0) return null;
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
                    · {group.length}
                  </span>
                </header>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {group.map((tpl) => (
                    <TemplateCard
                      key={tpl.id}
                      id={tpl.id}
                      name={tpl.name}
                      category={tpl.category}
                      keyCount={tpl.property_keys.length}
                      linkedItemCount={countByTemplate[tpl.id] ?? 0}
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
