"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";

const STAR_LABELS = ["Sehr schlecht", "Schlecht", "Okay", "Gut", "Ausgezeichnet"];

interface StarRatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
  name?: string;
}

export function StarRating({ value, onChange, name = "rating" }: StarRatingProps) {
  return (
    <RadioGroup
      value={value?.toString() ?? ""}
      onValueChange={(v) => onChange(v ? parseInt(v, 10) : null)}
      className="flex gap-0.5"
      aria-label="Sternebewertung auswählen"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <div key={star}>
          <RadioGroupItem
            value={star.toString()}
            id={`${name}-star-${star}`}
            className="sr-only"
          />
          <Label
            htmlFor={`${name}-star-${star}`}
            title={`${star} — ${STAR_LABELS[star - 1]}`}
            className={`cursor-pointer transition-colors ${
              value !== null && star <= value ? "text-yellow-400" : "text-cockpit-muted"
            } hover:text-yellow-300`}
          >
            <Star
              size={28}
              strokeWidth={1.75}
              fill={value !== null && star <= value ? "currentColor" : "none"}
              aria-hidden
            />
            <span className="sr-only">
              {star} Stern{star !== 1 ? "e" : ""} — {STAR_LABELS[star - 1]}
            </span>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
