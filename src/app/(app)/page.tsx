import { HeroSection } from "@/components/home/HeroSection";
import { MemberDashboard } from "@/components/home/MemberDashboard";
import { aggregateCounts } from "@/lib/items/aggregate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ItemCategory } from "@/types/supabase";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Setup Registry",
};

export default async function DashboardPage() {
  const isConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!isConfigured) {
    return <HeroSection />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <HeroSection />;
  }

  const [profileResult, itemsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("items")
      .select("category")
      .eq("user_id", user.id),
  ]);

  const username = profileResult.data?.username ?? null;
  const items = (itemsResult.data ?? []) as { category: ItemCategory }[];
  const counts = aggregateCounts(items);

  return <MemberDashboard username={username} counts={counts} />;
}
