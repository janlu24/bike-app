import { CATEGORY_CONFIG } from "@/lib/items/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GroupRow, ItemCategory } from "@/types/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface ComparePageProps {
  params: Promise<{ id: string }>;
}

interface ItemWithMeta {
  id: string;
  brand: string;
  model: string | null;
  metadata: Record<string, unknown>;
}

function computeIndividualProps(
  items: ItemWithMeta[],
  groupKeys: Set<string>
): Array<{ item: ItemWithMeta; props: Record<string, string> }> {
  return items
    .map((item) => {
      const individual: Record<string, string> = {};
      for (const [key, val] of Object.entries(item.metadata)) {
        if (!groupKeys.has(key)) {
          individual[key] = val !== null && val !== undefined ? String(val) : "";
        }
      }
      return { item, props: individual };
    })
    .filter(({ props }) => Object.keys(props).length > 0);
}

export default async function CompareGroupPage({ params }: ComparePageProps) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: raw } = await supabase
    .from("item_groups")
    .select("id, category, name, property_keys, created_at, updated_at, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!raw) notFound();
  const group = raw as GroupRow;

  const { data: rawItems } = await supabase
    .from("items")
    .select("id, brand, model, metadata")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = (rawItems ?? []) as ItemWithMeta[];

  if (items.length < 2) {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <BackLinks id={id} />
        <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-8 text-center shadow-cockpit">
          <p className="text-sm text-cockpit-muted">
            Mindestens 2 verknüpfte Items nötig für den Vergleich.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href={`/garage/new?groupId=${id}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-petrol-700 bg-petrol-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-petrol-500"
            >
              <Plus size={13} strokeWidth={2} aria-hidden />
              Item hinzufügen
            </Link>
            <Link
              href={`/garage/groups/${id}/edit`}
              className="inline-block text-xs text-petrol-400 hover:underline"
            >
              Gruppe bearbeiten
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const config = CATEGORY_CONFIG[group.category as ItemCategory];
  const CatIcon = config.icon;
  const groupKeySet = new Set(group.property_keys);
  const itemsWithIndividual = computeIndividualProps(items, groupKeySet);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <BackLinks id={id} />
            <div className="mt-3 flex items-center gap-2">
              <CatIcon size={14} strokeWidth={1.75} className="text-petrol-400" aria-hidden />
              <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
                {config.label} · Vergleich
              </p>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              <span className="text-petrol-400">{group.name}</span>
            </h1>
            <p className="mt-1 text-sm text-cockpit-muted">
              {items.length} Items verglichen · {group.property_keys.length} Eigenschaften
            </p>
          </div>
          <Link
            href={`/garage/new?groupId=${id}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-3.5 py-2 text-sm font-medium text-white shadow-cockpit transition-colors hover:bg-petrol-500"
          >
            <Plus size={15} strokeWidth={2} aria-hidden />
            Item hinzufügen
          </Link>
        </div>
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
                    href={`/garage/${item.id}`}
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
            {group.property_keys.map((key, rowIdx) => (
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
                  const val = item.metadata[key];
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

      {itemsWithIndividual.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] uppercase tracking-widest text-cockpit-muted">
            Individuelle Eigenschaften
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {itemsWithIndividual.map(({ item, props }) => (
              <Card
                key={item.id}
                className="border-cockpit-border bg-cockpit-surface shadow-cockpit"
              >
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-cockpit-text">
                    <Link
                      href={`/garage/${item.id}/edit`}
                      className="hover:text-petrol-400"
                    >
                      {item.brand}
                      {item.model ? ` ${item.model}` : ""}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <dl className="space-y-1">
                    {Object.entries(props).map(([key, val]) => (
                      <div key={key} className="flex gap-2 text-xs">
                        <dt className="shrink-0 text-cockpit-muted">{key}:</dt>
                        <dd className="text-cockpit-text">{val || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BackLinks({ id }: { id: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/garage/groups"
        className="inline-flex items-center gap-1 text-xs text-cockpit-muted hover:text-cockpit-text"
      >
        <ChevronLeft size={14} strokeWidth={1.75} aria-hidden />
        Zurück zu Gruppen
      </Link>
      <Link
        href="/garage"
        className="inline-flex items-center gap-1 rounded-md border border-cockpit-border px-2.5 py-1 text-xs text-cockpit-muted hover:text-cockpit-text"
      >
        ← Zur Garage
      </Link>
    </div>
  );
}
