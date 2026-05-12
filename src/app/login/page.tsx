import { Logo } from "@/components/Logo";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Anmelden · Setup Registry",
};

const URL_ERROR_MESSAGES: Record<string, string> = {
  link_expired:
    "Dieser Bestätigungslink ist abgelaufen. Bitte registriere dich erneut oder fordere eine neue E-Mail an.",
  auth: "Anmeldung fehlgeschlagen. Bitte versuche es erneut.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const urlError = error ? (URL_ERROR_MESSAGES[error] ?? URL_ERROR_MESSAGES.auth) : null;

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
          {urlError && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300"
            >
              {urlError}
            </div>
          )}
          <LoginForm />
        </div>

        <p className="text-center text-xs text-cockpit-muted">
          Privat by Default. Deine Daten gehören dir.
        </p>
      </div>
    </main>
  );
}
