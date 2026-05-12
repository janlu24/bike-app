import { Button } from "@/components/ui/button";
import { Bike, Globe, Scale, Settings2 } from "lucide-react";
import Link from "next/link";

const HIGHLIGHTS = [
  { icon: Bike, text: "Alle Bikes und Komponenten in einer Übersicht" },
  { icon: Scale, text: "Gewichte präzise erfassen und vergleichen" },
  { icon: Settings2, text: "Setups verwalten und Teile zuordnen" },
  { icon: Globe, text: "Profile teilen — privat by Default" },
] as const;

export function HeroSection() {
  return (
    <div className="flex flex-col items-center gap-10 py-8 text-center">
      {/* Tagline */}
      <div className="space-y-3">
        <p
          aria-hidden
          className="font-mono text-[11px] uppercase tracking-widest text-petrol-400"
        >
          Setup Registry
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-cockpit-text sm:text-4xl">
          Der digitale Zwilling{" "}
          <span className="text-petrol-400">deines Bikes.</span>
        </h1>
        <p className="mx-auto max-w-xs text-sm text-cockpit-muted">
          Erfasse Bikes, Komponenten und Gewichte. Präzise. Privat. Teilbar.
        </p>
      </div>

      {/* Feature Highlights */}
      <ul
        aria-label="Features"
        className="w-full max-w-sm space-y-2 text-left"
      >
        {HIGHLIGHTS.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-3 rounded-md border border-cockpit-border bg-cockpit-surface px-4 py-3"
          >
            <Icon
              size={15}
              strokeWidth={1.75}
              aria-hidden
              className="shrink-0 text-petrol-400"
            />
            <span className="text-sm text-cockpit-text">{text}</span>
          </li>
        ))}
      </ul>

      {/* CTAs */}
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button
          asChild
          className="w-full border border-petrol-700 bg-petrol-600 text-white hover:bg-petrol-500"
        >
          <Link href="/login">Jetzt registrieren</Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="w-full text-cockpit-muted hover:bg-cockpit-surface hover:text-cockpit-text"
        >
          <Link href="/explore">Community entdecken</Link>
        </Button>
      </div>
    </div>
  );
}
