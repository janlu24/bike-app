import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = {
  title: "Profil einrichten · Setup Registry",
};

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-cockpit-text">
              Profil einrichten
            </h1>
            <p className="text-sm text-cockpit-muted">
              Wähle einen Benutzernamen für dein Konto.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-5 shadow-cockpit">
          <OnboardingForm />
        </div>

        <p className="text-center text-xs text-cockpit-muted">
          Der Benutzername ist dauerhaft eindeutig und kann nicht geändert werden.
        </p>
      </div>
    </main>
  );
}
