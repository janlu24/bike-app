import { CATEGORY_CONFIG } from "@/lib/items/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ItemCategory, TemplateRow } from "@/types/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface ComparePageProps {
  params: Promise<{ id: string }>;
}

export default async function CompareTemplatePage({ params }: ComparePageProps) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: raw } = await supabase
    .from("item_templates")
    .select("id, category, name, property_keys, created_at, updated_at, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!raw) notFound();
  const template = raw as TemplateRow;

  const { data: rawItems } = await supabase
    .from("items")
    .select("id, brand, model, metadata")
    .eq("template_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = rawItems ?? [];

  if (items.length < 2) {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <BackLink />
        <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-8 text-center shadow-cockpit">
          <p className="text-sm text-cockpit-muted">
            Mindestens 2 verknüpfte Items nötig für den Vergleich.
          </p>
          <Link
            href={`/garage/templates/${id}/edit`}
            className="mt-4 inline-block text-xs text-petrol-400 hover:underline"
          >
            Vorlage bearbeiten
          </Link>
        </div>
      </div>
    );
  }

  const config = CATEGORY_CONFIG[template.category as ItemCategory];
  const CatIcon = config.icon;

  return (
    <div className="space-y-5">
      <div>
        <BackLink />
        <div className="mt-3 flex items-center gap-2">
          <CatIcon size={14} strokeWidth={1.75} className="text-petrol-400" aria-hidden />
          <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
            {config.label} · Vergleich
          </p>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="text-petrol-400">{template.name}</span>
        </h1>
        <p className="mt-1 text-sm text-cockpit-muted">
          {items.length} Items verglichen · {template.property_keys.length} Eigenschaften
        </p>
      </div>

      <ScrollArea className="w-full rounded-lg border border-cockpit-border shadow-cockpit">
        <Table>
          <TableHeader>
            <TableRow className="border-cockpit-border hover:bg-transparent">
              <TableHead
                scope="col"
                className="w-36 border-r border-cockpit-border bg-cockpit-surface text-[11px] uppercase tracking-widest text-cockpit-muted"
              >
                Eigenschaft
              </TableHead>
              {items.map((item) => (
                <TableHead
                  key={item.id}
                  scope="col"
                  className="bg-cockpit-surface text-xs font-medium text-cockpit-text"
                >
                  <Link
                    href={`/garage/${item.id}/edit`}
                    className="hover:text-petrol-400"
                  >
                    {item.brand}
                    {item.model ? ` ${item.model}` : ""}
                  </Link>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {template.property_keys.map((key, rowIdx) => (
              <TableRow
                key={key}
                className={
                  rowIdx % 2 === 0
                    ? "border-cockpit-border bg-cockpit-surface/40 hover:bg-cockpit-surface/60"
                    : "border-cockpit-border bg-cockpit-surface hover:bg-cockpit-surface"
                }
              >
                <th
                  scope="row"
                  className="border-r border-cockpit-border px-4 py-2 text-left text-xs font-medium text-cockpit-muted"
                >
                  {key}
                </th>
                {items.map((item) => {
                  const meta = (item.metadata as Record<string, unknown>) ?? {};
                  const val = meta[key];
                  const display =
                    val !== undefined && val !== null && String(val).trim() !== ""
                      ? String(val)
                      : "—";
                  return (
                    <TableCell
                      key={item.id}
                      className={
                        display === "—"
                          ? "px-4 py-2 text-xs text-cockpit-muted"
                          : "px-4 py-2 text-xs text-cockpit-text"
                      }
                    >
                      {display}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/garage/templates"
      className="inline-flex items-center gap-1 text-xs text-cockpit-muted hover:text-cockpit-text"
    >
      <ChevronLeft size={14} strokeWidth={1.75} aria-hidden />
      Zurück zu Vorlagen
    </Link>
  );
}
