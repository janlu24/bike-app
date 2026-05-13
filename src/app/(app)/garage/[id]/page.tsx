import { GeneralNoteSection } from "@/components/items/GeneralNoteSection";
import { ItemTourHistory } from "@/components/items/ItemTourHistory";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CATEGORY_CONFIG } from "@/lib/items/categories";
import { formatWeight } from "@/lib/utils/weight";
import type { BikeOption, GroupRow, ItemRow } from "@/types/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Link2, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

interface ViewItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewItemPage({ params }: ViewItemPageProps) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) notFound();
  const item = data as ItemRow;

  const config = CATEGORY_CONFIG[item.category];
  const Icon = config.icon;

  let parentBike: BikeOption | null = null;
  if (item.parent_id) {
    const { data: bike } = await supabase
      .from("items")
      .select("id, brand, model")
      .eq("id", item.parent_id)
      .eq("user_id", user.id)
      .maybeSingle();
    parentBike = (bike as BikeOption | null);
  }

  let groupName: string | undefined;
  if (item.group_id) {
    const { data: grp } = await supabase
      .from("item_groups")
      .select("name")
      .eq("id", item.group_id)
      .eq("user_id", user.id)
      .maybeSingle();
    groupName = (grp as Pick<GroupRow, "name"> | null)?.name;
  }

  const metadataEntries = Object.entries(
    (item.metadata as Record<string, unknown>) ?? {}
  );

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-petrol-800/60 bg-petrol-950/40 text-petrol-300"
          >
            <Icon size={20} strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
              {config.label}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {item.brand}{" "}
              <span className="text-petrol-400">{item.model}</span>
            </h1>
          </div>
        </div>
        <Link
          href={`/garage/${id}/edit`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-cockpit-border px-2.5 py-1.5 text-xs text-cockpit-muted transition-colors hover:border-petrol-600 hover:text-petrol-300"
        >
          <Pencil size={12} strokeWidth={1.75} aria-hidden />
          Bearbeiten
        </Link>
      </div>

      {/* Item detail card */}
      <div className="overflow-hidden rounded-lg border border-cockpit-border bg-cockpit-surface shadow-cockpit">
        {item.image_url && (
          <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-cockpit-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt={`${item.brand ?? ""} ${item.model ?? ""}`.trim()}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <dl className="divide-y divide-cockpit-border/50 px-5 py-1">
          <FieldRow label="Kategorie" value={config.label} />
          {item.weight_g !== null && (
            <FieldRow label="Gewicht" value={formatWeight(item.weight_g)} />
          )}
          {parentBike && (
            <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <dt className="text-[11px] uppercase tracking-widest text-cockpit-muted">
                Verbaut an
              </dt>
              <dd>
                <Link
                  href={`/garage?bikeId=${parentBike.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-petrol-800/60 bg-petrol-950/40 px-2.5 py-0.5 text-[11px] text-petrol-200 transition-colors hover:border-petrol-500 hover:shadow-[0_0_8px_rgba(51,159,167,0.4)]"
                  title="Build dieses Bikes anzeigen"
                >
                  <Link2 size={11} strokeWidth={1.75} aria-hidden />
                  {parentBike.brand}
                  {parentBike.model ? ` ${parentBike.model}` : ""}
                </Link>
              </dd>
            </div>
          )}
          {groupName && <FieldRow label="Gruppe" value={groupName} />}
          {metadataEntries.map(([key, val]) => (
            <FieldRow key={key} label={key} value={String(val)} />
          ))}
        </dl>
      </div>

      {/* General note inline edit */}
      <GeneralNoteSection itemId={id} initialNote={item.general_note} />

      {/* Tour history */}
      <ItemTourHistory itemId={id} />
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-[11px] uppercase tracking-widest text-cockpit-muted">
        {label}
      </dt>
      <dd className="text-right text-sm text-cockpit-text">{value}</dd>
    </div>
  );
}
