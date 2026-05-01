import { ItemForm } from "@/components/items/ItemForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BikeOption, TemplateRow } from "@/types/supabase";

export const metadata = {
  title: "Neues Item · Setup Registry",
};

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [bikes, templates] = await Promise.all([
    user
      ? supabase
          .from("items")
          .select("id, brand, model")
          .eq("user_id", user.id)
          .eq("category", "Bike")
          .order("created_at", { ascending: false })
          .then((r) => (r.data ?? []) as BikeOption[])
      : Promise.resolve([] as BikeOption[]),
    user
      ? supabase
          .from("item_templates")
          .select("id, name, category, property_keys")
          .eq("user_id", user.id)
          .order("name")
          .then((r) => (r.data ?? []) as Pick<TemplateRow, "id" | "name" | "category" | "property_keys">[])
      : Promise.resolve([] as Pick<TemplateRow, "id" | "name" | "category" | "property_keys">[]),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
          Neues Item
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          In <span className="text-petrol-400">die Garage</span> aufnehmen
        </h1>
        <p className="mt-1 text-sm text-cockpit-muted">
          Pflicht: Kategorie, Marke, Modell. Alles andere optional – inklusive
          beliebig vieler Zusatz-Attribute.
        </p>
      </div>

      <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-5 shadow-cockpit">
        <ItemForm bikes={bikes} templates={templates} />
      </div>
    </div>
  );
}
