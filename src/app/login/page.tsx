import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Anmelden · Setup Registry",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-cockpit-text">
              Willkommen zurück
            </h1>
            <p className="text-sm text-cockpit-muted">
              Melde dich an oder erstelle ein neues Konto.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-5 shadow-cockpit">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-cockpit-muted">
          Privat by Default. Deine Daten gehören dir.
        </p>
      </div>
    </main>
  );
}
