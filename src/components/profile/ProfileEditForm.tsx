"use client";

import { updateProfileAction } from "@/app/(app)/profile/actions";
import type { ProfileFormState } from "@/app/(app)/profile/schema";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileRow } from "@/types/supabase";
import { Save } from "lucide-react";
import { useActionState, useState } from "react";

interface ProfileEditFormProps {
  profile: Pick<
    ProfileRow,
    "username" | "full_name" | "bio" | "avatar_url" | "is_public" | "weight_unit"
  >;
  email: string;
}

const initial: ProfileFormState = {};

export function ProfileEditForm({ profile, email }: ProfileEditFormProps) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const [isPublic, setIsPublic] = useState(profile.is_public);
  const [weightUnit, setWeightUnit] = useState<"g" | "kg">(
    profile.weight_unit === "kg" ? "kg" : "g"
  );

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300"
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="rounded-md border border-petrol-700/60 bg-petrol-950/40 px-3 py-2 text-xs text-petrol-300"
        >
          {state.success}
        </div>
      )}

      {/* Avatar */}
      <div className="flex justify-center">
        <AvatarUploader
          initialUrl={profile.avatar_url}
          username={profile.username}
          error={state.fieldErrors?.avatar}
        />
      </div>

      <Separator className="border-cockpit-border" />

      {/* Read-only fields */}
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Konto
        </p>

        <div className="space-y-1.5">
          <Label className="text-cockpit-muted">E-Mail</Label>
          <p className="rounded-md border border-cockpit-border bg-cockpit-surface/50 px-3 py-2 text-sm text-cockpit-muted">
            {email}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-cockpit-muted">
            Benutzername{" "}
            <span className="text-xs font-normal">(nicht änderbar)</span>
          </Label>
          <p className="rounded-md border border-cockpit-border bg-cockpit-surface/50 px-3 py-2 text-sm text-cockpit-text">
            <span className="text-petrol-400">@</span>
            {profile.username}
          </p>
        </div>
      </div>

      <Separator className="border-cockpit-border" />

      {/* Editable fields */}
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Profil
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="full_name" className="text-cockpit-text">
            Anzeigename{" "}
            <span className="text-xs font-normal text-cockpit-muted">(optional)</span>
          </Label>
          <Input
            id="full_name"
            name="full_name"
            autoComplete="name"
            maxLength={120}
            defaultValue={profile.full_name ?? ""}
            disabled={pending}
            placeholder="z. B. Jan Lustig"
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

        <div className="space-y-1.5">
          <Label htmlFor="bio" className="text-cockpit-text">
            Bio{" "}
            <span className="text-xs font-normal text-cockpit-muted">(optional)</span>
          </Label>
          <Textarea
            id="bio"
            name="bio"
            maxLength={500}
            defaultValue={profile.bio ?? ""}
            disabled={pending}
            rows={3}
            placeholder="Erzähl etwas über dich und dein Setup …"
            aria-describedby={
              state.fieldErrors?.bio ? "bio-error" : "bio-hint"
            }
            className="border-cockpit-border bg-cockpit-bg text-cockpit-text placeholder:text-cockpit-muted"
          />
          {state.fieldErrors?.bio ? (
            <p id="bio-error" role="alert" className="text-xs text-red-400">
              {state.fieldErrors.bio}
            </p>
          ) : (
            <p id="bio-hint" className="text-xs text-cockpit-muted">
              Höchstens 500 Zeichen.
            </p>
          )}
        </div>
      </div>

      <Separator className="border-cockpit-border" />

      {/* Preferences */}
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Einstellungen
        </p>

        {/* Weight unit */}
        <div className="space-y-2">
          <Label className="text-cockpit-text">Gewichtseinheit</Label>
          <input type="hidden" name="weight_unit" value={weightUnit} />
          <RadioGroup
            value={weightUnit}
            onValueChange={(v) => setWeightUnit(v as "g" | "kg")}
            className="flex gap-4"
            aria-label="Gewichtseinheit auswählen"
          >
            {(["g", "kg"] as const).map((unit) => (
              <div key={unit} className="flex items-center gap-2">
                <RadioGroupItem
                  value={unit}
                  id={`weight-unit-${unit}`}
                  disabled={pending}
                  className="border-cockpit-border text-petrol-400"
                />
                <Label
                  htmlFor={`weight-unit-${unit}`}
                  className="cursor-pointer text-cockpit-text"
                >
                  {unit === "g" ? "Gramm (g)" : "Kilogramm (kg)"}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {state.fieldErrors?.weight_unit && (
            <p role="alert" className="text-xs text-red-400">
              {state.fieldErrors.weight_unit}
            </p>
          )}
          <p className="text-xs text-cockpit-muted">
            Beeinflusst die Anzeige aller Gewichte in der App. Vorhandene Werte werden nicht
            umgerechnet.
          </p>
        </div>

        {/* Public toggle */}
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
              Andere können deine als öffentlich markierten Items sehen. Dein Profil ist unter{" "}
              <span className="font-medium text-petrol-400">
                /profile/{profile.username}
              </span>{" "}
              erreichbar.
            </p>
          </div>
        </div>
        {state.fieldErrors?.is_public && (
          <p role="alert" className="text-xs text-red-400">
            {state.fieldErrors.is_public}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full border border-petrol-700 bg-petrol-600 text-white hover:bg-petrol-500"
      >
        <Save size={16} strokeWidth={2} aria-hidden />
        {pending ? "Wird gespeichert …" : "Speichern"}
      </Button>
    </form>
  );
}
