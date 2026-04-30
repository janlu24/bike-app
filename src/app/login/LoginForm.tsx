"use client";

import { signInAction, signUpAction } from "@/app/login/actions";
import type { AuthFormState } from "@/app/login/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus } from "lucide-react";
import { useActionState } from "react";

const initial: AuthFormState = {};

export function LoginForm() {
  const [signInState, signIn, signInPending] = useActionState(signInAction, initial);
  const [signUpState, signUp, signUpPending] = useActionState(signUpAction, initial);

  const error = signInState.error ?? signUpState.error;
  const notice = signInState.notice ?? signUpState.notice;
  const pending = signInPending || signUpPending;

  return (
    <form className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-cockpit-text">
          E-Mail
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="du@example.com"
          required
          disabled={pending}
          className="border-cockpit-border bg-cockpit-bg text-cockpit-text placeholder:text-cockpit-muted"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-cockpit-text">
          Passwort
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          className="border-cockpit-border bg-cockpit-bg text-cockpit-text"
        />
        <p className="text-xs text-cockpit-muted">Mindestens 8 Zeichen.</p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300"
        >
          {error}
        </div>
      )}
      {notice && !error && (
        <div
          role="status"
          className="rounded-md border border-petrol-700/60 bg-petrol-950/40 px-3 py-2 text-xs text-petrol-200"
        >
          {notice}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        <Button
          type="submit"
          formAction={signIn}
          disabled={pending}
          className="flex-1 border border-petrol-700 bg-petrol-600 text-white hover:bg-petrol-500"
        >
          <LogIn size={16} strokeWidth={2} aria-hidden />
          {signInPending ? "Anmelden …" : "Anmelden"}
        </Button>
        <Button
          type="submit"
          variant="ghost"
          formAction={signUp}
          disabled={pending}
          className="flex-1 text-cockpit-muted hover:bg-cockpit-surface hover:text-cockpit-text"
        >
          <UserPlus size={16} strokeWidth={2} aria-hidden />
          {signUpPending ? "Konto anlegen …" : "Neues Konto"}
        </Button>
      </div>
    </form>
  );
}
