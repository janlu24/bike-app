import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-mono text-sm tracking-widest", className)}>
      <span
        className="inline-block h-2 w-2 rounded-sm bg-petrol-500 shadow-[0_0_8px_rgba(13,115,119,0.8)]"
        aria-hidden
      />
      <span className="uppercase text-cockpit-text">
        Setup<span className="text-petrol-400">.</span>Registry
      </span>
    </div>
  );
}
