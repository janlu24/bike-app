import { GroupForm } from "@/components/groups/GroupForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GroupRow, ItemCategory } from "@/types/supabase";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface EditGroupPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGroupPage({ params }: EditGroupPageProps) {
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

  const { count: linkedItemCount } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("group_id", id)
    .eq("user_id", user.id);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Link
            href="/inventory/groups"
            className="inline-flex items-center gap-1 text-xs text-cockpit-muted hover:text-cockpit-text"
          >
            <ChevronLeft size={14} strokeWidth={1.75} aria-hidden />
            Zurück zu Gruppen
          </Link>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-1 rounded-md border border-cockpit-border px-2.5 py-1 text-xs text-cockpit-muted hover:text-cockpit-text"
          >
            ← Zum Lager
          </Link>
        </div>
        <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
          Gruppe bearbeiten
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="text-petrol-400">{group.name}</span>
        </h1>
        {(linkedItemCount ?? 0) > 0 && (
          <p className="mt-1 text-xs text-cockpit-muted">
            {linkedItemCount} verknüpfte{linkedItemCount === 1 ? "s Item" : " Items"} — Änderungen werden nach Bestätigung übertragen.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-5 shadow-cockpit">
        <GroupForm
          groupId={group.id}
          initialCategory={group.category as ItemCategory}
          initialName={group.name}
          originalKeys={group.property_keys}
          linkedItemCount={linkedItemCount ?? 0}
        />
      </div>
    </div>
  );
}
