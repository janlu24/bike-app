import { DeleteItemForm, ItemForm } from "@/components/items/ItemForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BikeOption, GroupRow, ItemRow } from "@/types/supabase";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface EditItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditItemPage({ params }: EditItemPageProps) {
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

  const bikes: BikeOption[] =
    (
      await supabase
        .from("items")
        .select("id, brand, model")
        .eq("user_id", user.id)
        .eq("category", "Bike")
        .order("created_at", { ascending: false })
    ).data ?? [];

  // If the item is linked to a group, resolve its name for the badge.
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

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
            Item bearbeiten
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {item.brand}{" "}
            <span className="text-petrol-400">{item.model}</span>
          </h1>
        </div>
        <DeleteItemForm item={item} />
      </div>

      <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-5 shadow-cockpit">
        <ItemForm item={item} bikes={bikes} groupName={groupName} />
      </div>
    </div>
  );
}
