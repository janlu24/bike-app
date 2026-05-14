"use client";

import {
  createGroupAction,
  updateGroupAction,
} from "@/app/(app)/garage/groups/actions";
import type { GroupFormState } from "@/app/(app)/garage/groups/schema";
import { CATEGORY_CONFIG, ITEM_CATEGORIES } from "@/lib/items/categories";
import { computeGroupDiff } from "@/lib/groups/validation";
import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/types/supabase";
import { Save, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GroupKeyEditor } from "./GroupKeyEditor";

interface GroupFormProps {
  groupId?: string;
  initialCategory?: ItemCategory;
  initialName?: string;
  originalKeys?: string[];
  linkedItemCount?: number;
}

type KeyDecision = "delete" | "keep";

const initial: GroupFormState = { data: null, fieldErrors: {} };

export function GroupForm({
  groupId,
  initialCategory,
  initialName,
  originalKeys = [],
  linkedItemCount = 0,
}: GroupFormProps) {
  const isEdit = Boolean(groupId);
  const action = isEdit
    ? updateGroupAction.bind(null, groupId!)
    : createGroupAction;

  const [state, formAction, pending] = useActionState(action, initial);
  const errors = state.fieldErrors;

  const formRef = useRef<HTMLFormElement>(null);
  const submitReady = useRef(false);

  const [category, setCategory] = useState<ItemCategory>(
    initialCategory ?? "Gear"
  );

  // Propagation modal state
  const [showModal, setShowModal] = useState(false);
  const [diff, setDiff] = useState<{ added: string[]; removed: string[] }>({
    added: [],
    removed: [],
  });
  const [decisions, setDecisions] = useState<Record<string, KeyDecision>>({});

  function getCurrentKeys(): string[] {
    if (!formRef.current) return [];
    return Array.from(formRef.current.querySelectorAll<HTMLInputElement>('input[name="property_key"]'))
      .map((el) => el.value.trim())
      .filter(Boolean);
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (submitReady.current) {
      submitReady.current = false;
      return;
    }
    if (!isEdit || linkedItemCount === 0) return;

    const currentKeys = getCurrentKeys();
    const d = computeGroupDiff(originalKeys, currentKeys);
    if (d.added.length === 0 && d.removed.length === 0) return;

    e.preventDefault();
    const initDecisions: Record<string, KeyDecision> = {};
    d.removed.forEach((k) => { initDecisions[k] = "delete"; });
    setDecisions(initDecisions);
    setDiff(d);
    setShowModal(true);
  }

  function handleConfirm() {
    setShowModal(false);
    submitReady.current = true;
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleFormSubmit}
        className="space-y-5"
        noValidate
      >
        {/* Hidden inputs for propagation decisions — populated before submit */}
        {Object.entries(decisions).map(([key, decision]) => (
          <input
            key={key}
            type="hidden"
            name={`removed_key_decision[${key}]`}
            value={decision}
          />
        ))}

        {/* Category */}
        <div className="space-y-1.5">
          <label
            htmlFor="category"
            className="block text-[11px] font-semibold uppercase tracking-widest text-cockpit-muted"
          >
            Kategorie
            <span aria-hidden className="ml-1 text-petrol-400">*</span>
          </label>
          {isEdit && <input type="hidden" name="category" value={category} />}
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory)}
            disabled={isEdit}
            className={cn(
              "w-full rounded-md border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text",
              "focus:border-petrol-500 focus:outline-none",
              isEdit && "cursor-not-allowed opacity-60"
            )}
          >
            {ITEM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_CONFIG[cat].label}
              </option>
            ))}
          </select>
          {!isEdit && (
            <p className="text-xs text-cockpit-muted">
              {CATEGORY_CONFIG[category].tooltip}
            </p>
          )}
          {isEdit && (
            <p className="text-xs text-cockpit-muted">
              Kategorie kann nach dem Anlegen nicht mehr geändert werden.
            </p>
          )}
          {errors.category && (
            <p className="text-xs text-red-400">{errors.category}</p>
          )}
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="block text-[11px] font-semibold uppercase tracking-widest text-cockpit-muted"
          >
            Name
            <span aria-hidden className="ml-1 text-petrol-400">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={80}
            defaultValue={initialName ?? ""}
            placeholder="z. B. Satteltaschen, Helme, Schaltwerke"
            aria-invalid={Boolean(errors.name) || undefined}
            className={cn(
              "w-full rounded-md border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text placeholder:text-cockpit-muted",
              "focus:outline-none",
              errors.name
                ? "border-red-700 focus:border-red-500"
                : "border-cockpit-border focus:border-petrol-500"
            )}
          />
          {errors.name && (
            <p className="text-xs text-red-400">{errors.name}</p>
          )}
        </div>

        {/* Keys */}
        <fieldset className="space-y-3 rounded-md border border-cockpit-border bg-cockpit-surface/60 p-4">
          <GroupKeyEditor initialKeys={originalKeys.length > 0 ? originalKeys : undefined} />
          {errors.property_keys && (
            <p className="text-xs text-red-400">{errors.property_keys}</p>
          )}
        </fieldset>

        {state.error && (
          <div
            role="alert"
            className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300"
          >
            {state.error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-4 py-2 text-sm font-medium text-white shadow-cockpit transition-colors hover:bg-petrol-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={16} strokeWidth={2} aria-hidden />
            {pending
              ? isEdit ? "Speichern …" : "Anlegen …"
              : isEdit ? "Änderungen speichern" : "Gruppe anlegen"}
          </button>
          <Link
            href="/inventory/groups"
            className="inline-flex items-center gap-2 rounded-md border border-cockpit-border px-4 py-2 text-sm text-cockpit-muted hover:text-cockpit-text"
          >
            <X size={16} strokeWidth={2} aria-hidden />
            Abbrechen
          </Link>
        </div>
      </form>

      {/* Propagation Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) setShowModal(false); }}>
        <DialogContent className="max-w-md border-cockpit-border bg-cockpit-surface text-cockpit-text">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Gruppe aktualisieren
            </DialogTitle>
            <p className="text-xs text-cockpit-muted">
              Diese Änderungen werden auf{" "}
              <strong className="text-cockpit-text">{linkedItemCount}</strong>{" "}
              verknüpfte{linkedItemCount === 1 ? "s Item" : " Items"} angewendet.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {diff.added.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-petrol-400">
                  Hinzugefügt
                </p>
                <ul className="space-y-1">
                  {diff.added.map((key) => (
                    <li key={key} className="flex items-center gap-2 text-xs text-cockpit-muted">
                      <span className="h-1.5 w-1.5 rounded-full bg-petrol-500" aria-hidden />
                      <span className="font-medium text-cockpit-text">{key}</span>
                      <span>— wird allen Items mit leerem Wert hinzugefügt</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {diff.removed.length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-red-400">
                  Entfernt
                </p>
                {diff.removed.map((key) => (
                  <div key={key} className="space-y-1.5 rounded-md border border-cockpit-border p-3">
                    <p className="text-xs font-medium text-cockpit-text">{key}</p>
                    <RadioGroup
                      value={decisions[key] ?? "delete"}
                      onValueChange={(v) =>
                        setDecisions((prev) => ({ ...prev, [key]: v as KeyDecision }))
                      }
                      className="gap-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="delete" id={`del-${key}`} className="border-cockpit-border" />
                        <Label htmlFor={`del-${key}`} className="cursor-pointer text-xs text-cockpit-muted">
                          Löschen{" "}
                          <span className="ml-1 rounded bg-cockpit-bg px-1 py-0.5 text-[10px]">
                            Standard
                          </span>
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="keep" id={`keep-${key}`} className="border-cockpit-border" />
                        <Label htmlFor={`keep-${key}`} className="cursor-pointer text-xs text-cockpit-muted">
                          Als freier Wert behalten
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-md border border-cockpit-border px-3 py-1.5 text-sm text-cockpit-muted hover:text-cockpit-text"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-md border border-petrol-700 bg-petrol-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-petrol-500"
            >
              Bestätigen & speichern
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
