import { Star } from "lucide-react";

const STAR_LABELS = ["Sehr schlecht", "Schlecht", "Okay", "Gut", "Ausgezeichnet"];

interface StarDisplayProps {
  rating: number;
  size?: number;
}

export function StarDisplay({ rating, size = 14 }: StarDisplayProps) {
  return (
    <span
      role="img"
      aria-label={`${rating} von 5 Sternen — ${STAR_LABELS[rating - 1]}`}
      className="flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          strokeWidth={1.75}
          aria-hidden
          className={star <= rating ? "text-yellow-400" : "text-cockpit-border"}
          fill={star <= rating ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}
