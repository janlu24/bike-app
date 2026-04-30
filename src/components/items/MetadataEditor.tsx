"use client";

import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface MetadataRow {
  id: string;
  key: string;
  value: string;
}

interface MetadataEditorProps {
  initial?: Record<string, string>;
}

export function MetadataEditor({ initial }: MetadataEditorProps) {
  const [rows, setRows] = useState<MetadataRow[]>(() => seedRows(initial));

  function addRow() {
    setRows((current) => [...current, makeRow()]);
  }

  function updateRow(id: string, patch: Partial<MetadataRow>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  function removeRow(id: string) {
    setRows((current) =>
      current.length === 1
        ? [{ ...makeRow() }]
        : current.filter((row) => row.id !== id)
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-cockpit-muted">
          Zusatz-Attribute
        </p>
        <p className="text-[11px] text-cockpit-muted">
          z. B. Farbe · Rahmengröße · Gear-Ratio
        </p>
      </div>

      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li
            key={row.id}
            className="grid grid-cols-[1fr,1fr,auto] items-center gap-2"
          >
            <input
              type="text"
              name="meta_key"
              value={row.key}
              onChange={(e) => updateRow(row.id, { key: e.target.value })}
              placeholder={index === 0 ? "Schlüssel" : "weiterer Schlüssel"}
              maxLength={40}
              className={cn(
                "rounded-md border border-cockpit-border bg-cockpit-surface px-3 py-1.5 text-sm text-cockpit-text",
                "placeholder:text-cockpit-muted focus:border-petrol-500 focus:outline-none"
              )}
            />
            <input
              type="text"
              name="meta_value"
              value={row.value}
              onChange={(e) => updateRow(row.id, { value: e.target.value })}
              placeholder="Wert"
              maxLength={200}
              className={cn(
                "rounded-md border border-cockpit-border bg-cockpit-surface px-3 py-1.5 text-sm text-cockpit-text",
                "placeholder:text-cockpit-muted focus:border-petrol-500 focus:outline-none"
              )}
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="rounded-md border border-cockpit-border p-1.5 text-cockpit-muted transition-colors hover:border-red-700 hover:text-red-400"
              aria-label={`Attribut ${row.key || index + 1} entfernen`}
            >
              <Trash2 size={14} strokeWidth={1.75} aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-cockpit-border px-3 py-1.5 text-xs text-cockpit-muted transition-colors hover:border-petrol-600 hover:text-petrol-300"
      >
        <Plus size={13} strokeWidth={1.75} aria-hidden />
        Attribut hinzufügen
      </button>
    </div>
  );
}

function seedRows(initial?: Record<string, string>): MetadataRow[] {
  const entries = Object.entries(initial ?? {});
  if (entries.length === 0) return [makeRow()];
  return entries.map(([key, value]) => ({ id: makeId(), key, value }));
}

function makeRow(): MetadataRow {
  return { id: makeId(), key: "", value: "" };
}

let counter = 0;
function makeId(): string {
  counter += 1;
  return `m_${counter}_${Math.random().toString(36).slice(2, 8)}`;
}
