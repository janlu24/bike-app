import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";

export default function GarageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-cockpit-bg text-cockpit-text">
      <header className="sticky top-0 z-30 border-b border-cockpit-border bg-cockpit-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Logo />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
