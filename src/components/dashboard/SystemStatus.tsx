import type { SupabaseStatus } from "@/lib/system/status";
import { cn } from "@/lib/utils";
import { Gauge } from "lucide-react";

type AuthStatus = "ok" | "warn" | "muted";

interface SystemStatusProps {
  supabaseStatus: SupabaseStatus;
  authLabel: string;
  authStatus: AuthStatus;
}

const supabaseLabels: Record<SupabaseStatus, string> = {
  connected: "verbunden",
  offline: "nicht erreichbar",
  not_configured: "nicht konfiguriert",
};

const dotClass: Record<"ok" | "warn" | "muted", string> = {
  ok: "bg-petrol-500 shadow-[0_0_6px_rgba(51,159,167,0.7)]",
  warn: "bg-amber-400",
  muted: "bg-cockpit-muted",
};

const labelClass: Record<"ok" | "warn" | "muted", string> = {
  ok: "text-petrol-400",
  warn: "text-amber-400",
  muted: "text-cockpit-muted",
};

const supabaseStatusVariant: Record<SupabaseStatus, "ok" | "warn" | "muted"> = {
  connected: "ok",
  offline: "warn",
  not_configured: "muted",
};

function StatusRow({
  rowLabel,
  valueLabel,
  variant,
}: {
  rowLabel: string;
  valueLabel: string;
  variant: "ok" | "warn" | "muted";
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-xs text-cockpit-muted">{rowLabel}</span>
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn("h-2 w-2 flex-shrink-0 rounded-full", dotClass[variant])}
        />
        <span className={cn("font-mono text-xs tabular-nums", labelClass[variant])}>
          {valueLabel}
        </span>
      </div>
    </div>
  );
}

export function SystemStatus({
  supabaseStatus,
  authLabel,
  authStatus,
}: SystemStatusProps) {
  const sbVariant = supabaseStatusVariant[supabaseStatus];

  return (
    <section
      aria-label="Systemstatus"
      className="rounded-lg border border-cockpit-border bg-cockpit-surface p-4"
    >
      <header className="mb-3 flex items-center gap-2">
        <Gauge size={14} strokeWidth={1.75} aria-hidden className="text-petrol-400" />
        <h2 className="text-[11px] font-medium uppercase tracking-widest text-cockpit-muted">
          Systemstatus
        </h2>
      </header>

      <div className="divide-y divide-cockpit-border">
        <StatusRow
          rowLabel="Supabase"
          valueLabel={supabaseLabels[supabaseStatus]}
          variant={sbVariant}
        />
        <StatusRow
          rowLabel="Auth-Session"
          valueLabel={authLabel}
          variant={authStatus}
        />
        <StatusRow rowLabel="Theme" valueLabel="dark · petrol" variant="ok" />
      </div>
    </section>
  );
}
