import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { WeightUnitProvider } from "@/lib/weight-unit-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WeightUnit } from "@/lib/utils/weight";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let weightUnit: WeightUnit = "g";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("weight_unit")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.weight_unit === "kg") {
      weightUnit = "kg";
    }
  }

  return (
    <WeightUnitProvider weightUnit={weightUnit}>
      <div className="min-h-dvh bg-cockpit-bg text-cockpit-text">
        <header className="sticky top-0 z-30 border-b border-cockpit-border bg-cockpit-bg/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Logo />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6">
          {children}
        </main>

        <BottomNav />
      </div>
    </WeightUnitProvider>
  );
}
