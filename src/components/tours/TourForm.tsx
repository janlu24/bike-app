"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { TourFormState } from "@/app/(app)/tours/schema";
import type { TourRow } from "@/types/supabase";

interface TourFormProps {
  action: (prev: TourFormState, formData: FormData) => Promise<TourFormState>;
  initialData?: TourRow;
  submitLabel?: string;
}

const empty: TourFormState = { data: null, fieldErrors: {} };

export function TourForm({ action, initialData, submitLabel = "Speichern" }: TourFormProps) {
  const [state, formAction, pending] = useActionState(action, empty);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error && (
        <p role="alert" className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      {/* Grunddaten */}
      <section className="space-y-4">
        <h2 className="text-[11px] uppercase tracking-widest text-cockpit-muted">Grunddaten</h2>

        <div className="space-y-1.5">
          <Label htmlFor="name">
            Name <span aria-hidden className="text-red-400">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={initialData?.name ?? ""}
            placeholder="z.B. Albaufstieg 2026"
            maxLength={100}
            aria-describedby={state.fieldErrors.name ? "name-error" : undefined}
            aria-invalid={!!state.fieldErrors.name}
          />
          {state.fieldErrors.name && (
            <p id="name-error" role="alert" className="text-xs text-red-400">{state.fieldErrors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="start_date">Startdatum</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              defaultValue={initialData?.start_date ?? ""}
              aria-describedby={state.fieldErrors.start_date ? "start-date-error" : undefined}
              aria-invalid={!!state.fieldErrors.start_date}
            />
            {state.fieldErrors.start_date && (
              <p id="start-date-error" role="alert" className="text-xs text-red-400">{state.fieldErrors.start_date}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="end_date">Enddatum</Label>
            <Input
              id="end_date"
              name="end_date"
              type="date"
              defaultValue={initialData?.end_date ?? ""}
              aria-describedby={state.fieldErrors.end_date ? "end-date-error" : undefined}
              aria-invalid={!!state.fieldErrors.end_date}
            />
            {state.fieldErrors.end_date && (
              <p id="end-date-error" role="alert" className="text-xs text-red-400">{state.fieldErrors.end_date}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={initialData?.status ?? "planned"}>
              <SelectTrigger id="status" aria-label="Tour-Status auswählen">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Geplant</SelectItem>
                <SelectItem value="completed">Gefahren</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="start_location">Start</Label>
            <Input
              id="start_location"
              name="start_location"
              defaultValue={initialData?.start_location ?? ""}
              placeholder="z.B. Reutlingen"
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="destination">Ziel</Label>
            <Input
              id="destination"
              name="destination"
              defaultValue={initialData?.destination ?? ""}
              placeholder="z.B. Albstadt"
              maxLength={200}
            />
          </div>
        </div>
      </section>

      <Separator className="border-cockpit-border" />

      {/* Geplante Werte */}
      <section className="space-y-4">
        <h2 className="text-[11px] uppercase tracking-widest text-cockpit-muted">Geplant</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="planned_distance_km">Distanz (km)</Label>
            <Input
              id="planned_distance_km"
              name="planned_distance_km"
              type="number"
              min="0"
              step="0.1"
              defaultValue={initialData?.planned_distance_km ?? ""}
              placeholder="0"
              aria-describedby={state.fieldErrors.planned_distance_km ? "plan-dist-error" : undefined}
            />
            {state.fieldErrors.planned_distance_km && (
              <p id="plan-dist-error" role="alert" className="text-xs text-red-400">{state.fieldErrors.planned_distance_km}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="planned_elevation_up_m">Höhenmeter ↑ (m)</Label>
            <Input
              id="planned_elevation_up_m"
              name="planned_elevation_up_m"
              type="number"
              min="0"
              step="1"
              defaultValue={initialData?.planned_elevation_up_m ?? ""}
              placeholder="0"
              aria-describedby={state.fieldErrors.planned_elevation_up_m ? "plan-up-error" : undefined}
            />
            {state.fieldErrors.planned_elevation_up_m && (
              <p id="plan-up-error" role="alert" className="text-xs text-red-400">{state.fieldErrors.planned_elevation_up_m}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="planned_elevation_down_m">Höhenmeter ↓ (m)</Label>
            <Input
              id="planned_elevation_down_m"
              name="planned_elevation_down_m"
              type="number"
              min="0"
              step="1"
              defaultValue={initialData?.planned_elevation_down_m ?? ""}
              placeholder="0"
              aria-describedby={state.fieldErrors.planned_elevation_down_m ? "plan-down-error" : undefined}
            />
            {state.fieldErrors.planned_elevation_down_m && (
              <p id="plan-down-error" role="alert" className="text-xs text-red-400">{state.fieldErrors.planned_elevation_down_m}</p>
            )}
          </div>
        </div>
      </section>

      <Separator className="border-cockpit-border" />

      {/* Gefahrene Werte */}
      <section className="space-y-4">
        <h2 className="text-[11px] uppercase tracking-widest text-cockpit-muted">Gefahren</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="actual_distance_km">Distanz (km)</Label>
            <Input
              id="actual_distance_km"
              name="actual_distance_km"
              type="number"
              min="0"
              step="0.1"
              defaultValue={initialData?.actual_distance_km ?? ""}
              placeholder="0"
              aria-describedby={state.fieldErrors.actual_distance_km ? "act-dist-error" : undefined}
            />
            {state.fieldErrors.actual_distance_km && (
              <p id="act-dist-error" role="alert" className="text-xs text-red-400">{state.fieldErrors.actual_distance_km}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="actual_elevation_up_m">Höhenmeter ↑ (m)</Label>
            <Input
              id="actual_elevation_up_m"
              name="actual_elevation_up_m"
              type="number"
              min="0"
              step="1"
              defaultValue={initialData?.actual_elevation_up_m ?? ""}
              placeholder="0"
              aria-describedby={state.fieldErrors.actual_elevation_up_m ? "act-up-error" : undefined}
            />
            {state.fieldErrors.actual_elevation_up_m && (
              <p id="act-up-error" role="alert" className="text-xs text-red-400">{state.fieldErrors.actual_elevation_up_m}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="actual_elevation_down_m">Höhenmeter ↓ (m)</Label>
            <Input
              id="actual_elevation_down_m"
              name="actual_elevation_down_m"
              type="number"
              min="0"
              step="1"
              defaultValue={initialData?.actual_elevation_down_m ?? ""}
              placeholder="0"
              aria-describedby={state.fieldErrors.actual_elevation_down_m ? "act-down-error" : undefined}
            />
            {state.fieldErrors.actual_elevation_down_m && (
              <p id="act-down-error" role="alert" className="text-xs text-red-400">{state.fieldErrors.actual_elevation_down_m}</p>
            )}
          </div>
        </div>

        {/* Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="duration_hours">Dauer – Stunden</Label>
            <Input
              id="duration_hours"
              name="duration_hours"
              type="number"
              min="0"
              max="999"
              step="1"
              defaultValue={initialData?.duration_hours ?? ""}
              placeholder="0"
              aria-describedby={state.fieldErrors.duration_hours ? "dur-h-error" : undefined}
            />
            {state.fieldErrors.duration_hours && (
              <p id="dur-h-error" role="alert" className="text-xs text-red-400">{state.fieldErrors.duration_hours}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="duration_minutes">Dauer – Minuten</Label>
            <Input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min="0"
              max="59"
              step="1"
              defaultValue={initialData?.duration_minutes ?? ""}
              placeholder="0"
              aria-describedby={state.fieldErrors.duration_minutes ? "dur-m-error" : undefined}
            />
            {state.fieldErrors.duration_minutes && (
              <p id="dur-m-error" role="alert" className="text-xs text-red-400">{state.fieldErrors.duration_minutes}</p>
            )}
          </div>
        </div>
      </section>

      <Separator className="border-cockpit-border" />

      {/* Sichtbarkeit */}
      <section className="space-y-3">
        <h2 className="text-[11px] uppercase tracking-widest text-cockpit-muted">Sichtbarkeit</h2>
        <div className="flex items-start gap-3">
          <Switch
            id="is_public"
            name="is_public"
            value="on"
            defaultChecked={initialData?.is_public ?? false}
            aria-describedby="is_public-hint"
          />
          <div className="space-y-1">
            <Label htmlFor="is_public" className="cursor-pointer">Öffentlich sichtbar</Label>
            <p id="is_public-hint" className="text-xs text-cockpit-muted">
              Start, Ziel und alle Tourdaten werden für andere Nutzer sichtbar.
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Speichert…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
