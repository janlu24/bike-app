import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CATEGORY_CONFIG } from "@/lib/items/categories";
import type { ExploreItem } from "@/lib/explore/types";
import { formatWeight } from "@/lib/utils/weight";
import Link from "next/link";

interface ExploreItemCardProps {
  item: ExploreItem;
}

export function ExploreItemCard({ item }: ExploreItemCardProps) {
  const config = CATEGORY_CONFIG[item.category];
  const Icon = config.icon;
  const initials = item.owner.username.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/profile/${item.owner.username}`}
      className="group block rounded-lg border border-cockpit-border bg-cockpit-surface shadow-cockpit transition-colors hover:border-petrol-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-petrol-500"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-lg">
        {item.image_url && (
          <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-cockpit-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt={`${item.brand} ${item.model ?? ""}`.trim()}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cockpit-surface/80 via-petrol-950/20 to-transparent"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3 p-4">
          <header className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-petrol-800/60 bg-petrol-950/40 text-petrol-300"
            >
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-cockpit-muted">
                {config.label}
              </p>
              <h3 className="truncate text-sm font-semibold text-cockpit-text">
                {item.brand}
              </h3>
              {item.model && (
                <p className="truncate text-xs text-cockpit-muted">{item.model}</p>
              )}
            </div>
          </header>

          {item.weight_g !== null && (
            <dl className="border-t border-cockpit-border pt-3 text-xs">
              <div className="flex items-baseline justify-between">
                <dt className="uppercase tracking-widest text-cockpit-muted">
                  Gewicht
                </dt>
                <dd className="text-cockpit-text">{formatWeight(item.weight_g)}</dd>
              </div>
            </dl>
          )}

          <footer className="mt-auto flex items-center gap-2 border-t border-cockpit-border pt-3">
            <Avatar className="h-5 w-5 shrink-0 border border-petrol-800/60">
              {item.owner.avatar_url && (
                <AvatarImage src={item.owner.avatar_url} alt="" />
              )}
              <AvatarFallback className="bg-petrol-950 text-[9px] font-medium text-petrol-300">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-[11px] text-cockpit-muted">
              <span className="text-petrol-400">@</span>
              {item.owner.username}
            </span>
          </footer>
        </div>
      </article>
    </Link>
  );
}
