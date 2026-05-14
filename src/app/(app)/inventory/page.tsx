import { InventoryClient } from "@/components/items/InventoryClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ItemRow } from "@/types/supabase";
import { LayoutTemplate, Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lager · Setup Registry",
};

export default async function InventoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rawItems } = user
    ? await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] as ItemRow[] };

  const items = (rawItems ?? []) as ItemRow[];

  const parentLookup: Record<string, { id: string; brand: string; model: string | null }> = {};
  for (const item of items) {
    if (item.category === "Bike") {
      parentLookup[item.id] = { id: item.id, brand: item.brand, model: item.model };
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
            Inventar
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dein <span className="text-petrol-400">Lager</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/inventory/groups"
            className="inline-flex items-center gap-2 rounded-md border border-cockpit-border px-3.5 py-2 text-sm text-cockpit-muted shadow-cockpit transition-colors hover:border-petrol-700 hover:text-cockpit-text"
          >
            <LayoutTemplate size={15} strokeWidth={1.75} aria-hidden />
            Gruppen
          </Link>
          <Link
            href="/inventory/new"
            className="inline-flex items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-3.5 py-2 text-sm font-medium text-white shadow-cockpit transition-colors hover:bg-petrol-500"
          >
            <Plus size={16} strokeWidth={2} aria-hidden />
            Neues Item
          </Link>
        </div>
      </header>

      <InventoryClient items={items} parentLookup={parentLookup} />
    </div>
  );
}
