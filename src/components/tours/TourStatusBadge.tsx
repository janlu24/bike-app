import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TourStatus } from "@/types/supabase";

interface TourStatusBadgeProps {
  status: TourStatus;
  className?: string;
}

export function TourStatusBadge({ status, className }: TourStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] uppercase tracking-widest font-medium",
        status === "completed"
          ? "border-petrol-700 bg-petrol-950/40 text-petrol-300"
          : "border-cockpit-border bg-transparent text-cockpit-muted",
        className
      )}
    >
      {status === "completed" ? "Gefahren" : "Geplant"}
    </Badge>
  );
}
