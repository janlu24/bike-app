import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, bio, avatar_url, is_public, weight_unit")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
          Einstellungen
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Dein <span className="text-petrol-400">Profil</span>
        </h1>
      </header>

      <div className="rounded-lg border border-cockpit-border bg-card p-5">
        <ProfileEditForm
          profile={profile}
          email={user.email ?? ""}
        />
      </div>

      {profile.is_public && (
        <div className="rounded-lg border border-petrol-800/60 bg-petrol-950/30 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-petrol-400">
            Öffentliches Profil
          </p>
          <p className="mt-1 text-sm text-cockpit-muted">
            Dein Profil ist öffentlich einsehbar unter:
          </p>
          <Link
            href={`/profile/${profile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-petrol-400 underline-offset-4 hover:underline"
          >
            <ExternalLink size={13} strokeWidth={1.75} aria-hidden />
            /profile/{profile.username}
          </Link>
        </div>
      )}

      <div className="rounded-lg border border-cockpit-border bg-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Sitzung
        </p>
        <form action="/auth/signout" method="POST" className="mt-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md border border-cockpit-border px-3.5 py-2 text-sm text-cockpit-muted transition-colors hover:border-red-700/60 hover:text-red-400"
          >
            <LogOut size={14} strokeWidth={1.75} aria-hidden />
            Abmelden
          </button>
        </form>
      </div>
    </div>
  );
}
