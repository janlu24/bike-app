import { CategoryTile } from "@/components/dashboard/CategoryTile";
import { aggregateCounts } from "@/lib/items/aggregate";
import { ITEM_CATEGORIES } from "@/lib/items/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ItemCategory } from "@/types/supabase";
import { Plus, Shield } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cockpit · Setup Registry",
};

export default async function DashboardPage() {
  const isConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let username: string | null = null;
  let items: { category: ItemCategory }[] = [];

  if (isConfigured) {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user ?? null;

    if (user) {
      const [profileResult, itemsResult] = await Promise.all([
        supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
        supabase.from("items").select("category").eq("user_id", user.id),
      ]);
      username = profileResult.data?.username ?? null;
      items = (itemsResult.data ?? []) as { category: ItemCategory }[];
    }
  }

  const counts = aggregateCounts(items);

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

        <Link
          href="/garage/new"
          className="inline-flex items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-3.5 py-2 text-sm font-medium text-white shadow-cockpit transition-colors hover:bg-petrol-500"
        >
          <Plus size={16} strokeWidth={2} aria-hidden />
          Neues Item
        </Link>
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
            className="mt-0.5 flex-shrink-0 text-petrol-400"
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
