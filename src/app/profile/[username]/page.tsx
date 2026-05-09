import { PublicItemList } from "@/components/profile/PublicItemList";
import { PublicProfileHeader } from "@/components/profile/PublicProfileHeader";
import { Separator } from "@/components/ui/separator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ItemRow } from "@/types/supabase";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, bio, avatar_url, is_public")
    .eq("username", username)
    .maybeSingle();

  if (!profile || !profile.is_public) {
    notFound();
  }

  const { data: rawItems } = await supabase
    .from("items")
    .select("id, category, brand, model, weight_g, is_public, metadata, image_url, user_id, parent_id, group_id, created_at, updated_at")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("category")
    .limit(50);

  const items = (rawItems ?? []) as ItemRow[];

  return (
    <div className="min-h-dvh bg-cockpit-bg text-cockpit-text">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <PublicProfileHeader
          username={profile.username}
          full_name={profile.full_name}
          bio={profile.bio}
          avatar_url={profile.avatar_url}
        />

        <Separator className="border-cockpit-border" />

        <section aria-label="Öffentliche Items">
          <header className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Setup
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              Öffentliche <span className="text-petrol-400">Items</span>
            </h2>
          </header>

          <PublicItemList items={items} />
        </section>
      </div>
    </div>
  );
}
