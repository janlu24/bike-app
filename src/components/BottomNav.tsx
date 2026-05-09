"use client";

import { cn } from "@/lib/utils";
import { Bike, Compass, Home, Map, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  Icon: typeof Home;
};

const items: NavItem[] = [
  { href: "/", label: "Dashboard", Icon: Home },
  { href: "/garage", label: "Garage", Icon: Bike },
  { href: "/tours", label: "Touren", Icon: Map },
  { href: "/explore", label: "Entdecken", Icon: Compass },
  { href: "/profile", label: "Profil", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-cockpit-border bg-cockpit-surface/90 backdrop-blur supports-[backdrop-filter]:bg-cockpit-surface/70"
    >
      <ul className="mx-auto flex max-w-5xl items-stretch justify-between px-2">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium uppercase tracking-wide transition-colors",
                  active
                    ? "text-petrol-400"
                    : "text-cockpit-muted hover:text-cockpit-text"
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden
                  className={cn(
                    "transition-transform",
                    active && "drop-shadow-[0_0_6px_rgba(51,159,167,0.6)]"
                  )}
                />
                <span>{label}</span>
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 h-[2px] w-6 rounded-full transition-colors",
                    active ? "bg-petrol-500" : "bg-transparent"
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" aria-hidden />
    </nav>
  );
}
