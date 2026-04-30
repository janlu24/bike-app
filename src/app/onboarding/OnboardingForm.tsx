"use client";

import { useActionState, useState } from "react";
import { createProfileAction } from "@/app/onboarding/actions";
import type { OnboardingFormState } from "@/app/onboarding/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Rocket } from "lucide-react";

const initial: OnboardingFormState = {};

export function OnboardingForm() {
  const [state, action, pending] = useActionState(createProfileAction, initial);
  const [isPublic, setIsPublic] = useState(false);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-cockpit-text">
          Benutzername{" "}
          <span className="text-xs font-normal text-cockpit-muted">
            (dauerhaft eindeutig)
          </span>
        </Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={32}
          placeholder="z. B. petrol_rider"
          disabled={pending}
          aria-describedby={
            state.fieldErrors?.username ? "username-error" : "username-hint"
          }
          className="border-cockpit-border bg-cockpit-bg text-cockpit-text placeholder:text-cockpit-muted"
        />
        {state.fieldErrors?.username ? (
          <p id="username-error" role="alert" className="text-xs text-red-400">
            {state.fieldErrors.username}
          </p>
        ) : (
          <p id="username-hint" className="text-xs text-cockpit-muted">
            3–32 Zeichen, Buchstaben / Ziffern / - / _. Kann nicht geändert werden.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="full_name" className="text-cockpit-text">
          Anzeigename{" "}
          <span className="text-xs font-normal text-cockpit-muted">(optional)</span>
        </Label>
        <Input
          id="full_name"
          name="full_name"
          autoComplete="name"
          maxLength={80}
          placeholder="Jan Lustig"
          disabled={pending}
          aria-describedby={
            state.fieldErrors?.full_name ? "full-name-error" : undefined
          }
          className="border-cockpit-border bg-cockpit-bg text-cockpit-text placeholder:text-cockpit-muted"
        />
        {state.fieldErrors?.full_name && (
          <p id="full-name-error" role="alert" className="text-xs text-red-400">
            {state.fieldErrors.full_name}
          </p>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-md border border-cockpit-border bg-cockpit-bg p-3">
        <input type="hidden" name="is_public" value={isPublic ? "on" : ""} />
        <Switch
          id="is_public_switch"
          checked={isPublic}
          onCheckedChange={setIsPublic}
          disabled={pending}
          className="mt-0.5 shrink-0"
        />
        <div className="space-y-0.5">
          <label
            htmlFor="is_public_switch"
            className="block cursor-pointer text-sm font-medium text-cockpit-text"
          >
            Profil öffentlich machen
          </label>
          <p className="text-xs text-cockpit-muted">
            Andere können deine als öffentlich markierten Items sehen. Lässt
            sich jederzeit ändern.
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full border border-petrol-700 bg-petrol-600 text-white hover:bg-petrol-500"
      >
        <Rocket size={16} strokeWidth={2} aria-hidden />
        {pending ? "Profil wird angelegt …" : "Profil anlegen"}
      </Button>
    </form>
  );
}
