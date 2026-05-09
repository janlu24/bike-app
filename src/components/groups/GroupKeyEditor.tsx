"use client";

import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface KeyRow {
  id: string;
  value: string;
}

interface GroupKeyEditorProps {
  initialKeys?: string[];
}

let counter = 0;
function makeId(): string {
  counter += 1;
  return `tk_${counter}_${Math.random().toString(36).slice(2, 8)}`;
}

function seedRows(initial?: string[]): KeyRow[] {
  if (!initial || initial.length === 0) return [{ id: makeId(), value: "" }];
  return initial.map((k) => ({ id: makeId(), value: k }));
}

export function GroupKeyEditor({ initialKeys }: GroupKeyEditorProps) {
  const [rows, setRows] = useState<KeyRow[]>(() => seedRows(initialKeys));

  function addRow() {
    setRows((prev) => [...prev, { id: makeId(), value: "" }]);
  }

  function updateRow(id: string, value: string) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, value } : row))
    );
  }

  function removeRow(id: string) {
    setRows((prev) =>
      prev.length === 1
        ? [{ id: makeId(), value: "" }]
        : prev.filter((row) => row.id !== id)
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-cockpit-muted">
          Eigenschafts-Schlüssel
        </p>
        <p className="text-[11px] text-cockpit-muted">z. B. Volumen · Gewicht · Farbe</p>
      </div>

      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li key={row.id} className="flex items-center gap-2">
            <input
              type="text"
              name="property_key"
              value={row.value}
              onChange={(e) => updateRow(row.id, e.target.value)}
              placeholder={index === 0 ? "Schlüssel" : "weiterer Schlüssel"}
              maxLength={40}
              className={cn(
                "flex-1 rounded-md border border-cockpit-border bg-cockpit-surface px-3 py-1.5 text-sm text-cockpit-text",
                "placeholder:text-cockpit-muted focus:border-petrol-500 focus:outline-none"
              )}
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="rounded-md border border-cockpit-border p-1.5 text-cockpit-muted transition-colors hover:border-red-700 hover:text-red-400"
              aria-label={`Schlüssel ${row.value || index + 1} entfernen`}
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
        Schlüssel hinzufügen
      </button>
    </div>
  );
}
