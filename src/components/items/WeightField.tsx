"use client";

import { cn } from "@/lib/utils";
import { type WeightUnit, gramsToInputValue, parseToGrams } from "@/lib/utils/weight";
import { useId, useState } from "react";

interface WeightFieldProps {
  initialGrams?: number | null;
  error?: string;
}

export function WeightField({ initialGrams = null, error }: WeightFieldProps) {
  const inputId = useId();
  const initialUnit: WeightUnit =
    initialGrams !== null && initialGrams >= 1000 ? "kg" : "g";

  const [unit, setUnit] = useState<WeightUnit>(initialUnit);
  const [value, setValue] = useState<string>(
    initialGrams !== null ? gramsToInputValue(initialGrams, initialUnit) : ""
  );

  function switchUnit(next: WeightUnit) {
    if (next === unit) return;
    if (value.trim() !== "") {
      const grams = parseToGrams(value, unit);
      setValue(grams !== null ? gramsToInputValue(grams, next) : value);
    }
    setUnit(next);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-3">
        <label
          htmlFor={inputId}
          className="block text-[11px] font-semibold uppercase tracking-widest text-cockpit-muted"
        >
          Gewicht
        </label>
        <UnitToggle unit={unit} onChange={switchUnit} />
      </div>

      <input type="hidden" name="weight_unit" value={unit} />
      <input
        id={inputId}
        name="weight_g"
        type="text"
        inputMode={unit === "kg" ? "decimal" : "numeric"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={unit === "kg" ? "z. B. 7,45" : "z. B. 450"}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${inputId}-err` : `${inputId}-hint`}
        className={cn(
          "w-full rounded-md border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text placeholder:text-cockpit-muted",
          "transition-colors focus:outline-none focus:ring-0",
          error
            ? "border-red-700 focus:border-red-500"
            : "border-cockpit-border focus:border-petrol-500"
        )}
      />
      {error ? (
        <p id={`${inputId}-err`} className="text-xs text-red-400">{error}</p>
      ) : (
        <p id={`${inputId}-hint`} className="text-xs text-cockpit-muted">
          {unit === "kg"
            ? "Komma oder Punkt erlaubt – z. B. 7,45 oder 7.45."
            : "Ganze Zahlen, in Gramm."}
        </p>
      )}
    </div>
  );
}

function UnitToggle({
  unit,
  onChange,
}: {
  unit: WeightUnit;
  onChange: (next: WeightUnit) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Einheit"
      className="inline-flex overflow-hidden rounded-md border border-cockpit-border bg-cockpit-surface text-[11px] uppercase tracking-widest"
    >
      {(["g", "kg"] as const).map((u) => {
        const active = u === unit;
        return (
          <button
            key={u}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(u)}
            className={cn(
              "px-2.5 py-1 transition-colors",
              active
                ? "bg-petrol-600 text-white"
                : "text-cockpit-muted hover:text-cockpit-text"
            )}
          >
            {u}
          </button>
        );
      })}
    </div>
  );
}
