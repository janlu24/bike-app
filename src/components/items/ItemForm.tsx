"use client";

import { createItemAction, deleteItemAction, updateItemAction } from "@/app/(app)/garage/actions";
import type { ItemFormState } from "@/app/(app)/garage/schema";
import { CATEGORY_CONFIG, ITEM_CATEGORIES } from "@/lib/items/categories";
import { CATEGORIES_WITH_PARENT } from "@/lib/items/validation";
import { cn } from "@/lib/utils";
import type { BikeOption, ItemCategory, ItemRow, TemplateRow } from "@/types/supabase";
import { Info, LayoutTemplate, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ImageUploader } from "./ImageUploader";
import { MetadataEditor } from "./MetadataEditor";
import { WeightField } from "./WeightField";

type TemplateSeed = Pick<TemplateRow, "id" | "name" | "category" | "property_keys">;

interface ItemFormProps {
  item?: ItemRow;
  bikes?: BikeOption[];
  templates?: TemplateSeed[];
  templateName?: string;
}

const CATEGORY_TOOLTIPS: Record<ItemCategory, string> = {
  Bike: "Komplette Räder – sie tragen die zugeordneten Komponenten.",
  Part: "Komponenten: Dinge, die fest am Fahrrad verbaut sind (z. B. Bremsen, Gabel, Schaltung, fest montierte Taschen).",
  Gear: "Equipment: Dinge, die man flexibel auf eine Tour mitnimmt (z. B. Zelt, Werkzeug, Powerbanks, Kleidung).",
  Clothing: "Bekleidung – Trikots, Hosen, Schuhe; reist mit, gehört aber nicht ans Bike.",
};

const initial: ItemFormState = { data: null, fieldErrors: {} };

export function ItemForm({ item, bikes = [], templates = [], templateName }: ItemFormProps) {
  const isEdit = Boolean(item);
  const action = isEdit
    ? updateItemAction.bind(null, item!.id)
    : createItemAction;

  const [state, formAction, pending] = useActionState(action, initial);
  const errors = state.fieldErrors;

  const [category, setCategory] = useState<ItemCategory>(
    item?.category ?? "Bike"
  );
  const showParent = CATEGORIES_WITH_PARENT.includes(category);
  const availableBikes = bikes.filter((b) => b.id !== item?.id);

  // Template selector state (create mode only).
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const categoryTemplates = templates.filter((t) => t.category === category);

  function handleCategoryChange(cat: ItemCategory) {
    setCategory(cat);
    setSelectedTemplateId("");
  }

  const selectedTemplate = categoryTemplates.find((t) => t.id === selectedTemplateId);
  const templateInitialMeta: Record<string, string> | undefined = selectedTemplate
    ? Object.fromEntries(selectedTemplate.property_keys.map((k) => [k, ""]))
    : undefined;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/* Category */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor="category"
            className="block text-[11px] font-semibold uppercase tracking-widest text-cockpit-muted"
          >
            Kategorie
            <span aria-hidden className="ml-1 text-petrol-400" title="Pflichtfeld">
              *
            </span>
          </label>
          <span
            tabIndex={0}
            role="img"
            aria-label={`Erklärung: ${CATEGORY_TOOLTIPS[category]}`}
            title={CATEGORY_TOOLTIPS[category]}
            className="inline-flex cursor-help text-cockpit-muted transition-colors hover:text-petrol-400 focus:text-petrol-400 focus:outline-none"
          >
            <Info size={12} strokeWidth={1.75} aria-hidden />
          </span>
        </div>
        <select
          id="category"
          name="category"
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value as ItemCategory)}
          required
          className="w-full rounded-md border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text focus:border-petrol-500 focus:outline-none"
        >
          {ITEM_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_CONFIG[cat].label}
            </option>
          ))}
        </select>
        <p className="text-xs text-cockpit-muted">{CATEGORY_TOOLTIPS[category]}</p>
        {errors.category && (
          <p className="text-xs text-red-400">{errors.category}</p>
        )}
      </div>

      {/* Template badge (edit mode — read-only) */}
      {isEdit && templateName && (
        <div className="flex items-center gap-1.5 rounded-md border border-cockpit-border bg-cockpit-surface/60 px-3 py-2">
          <LayoutTemplate size={13} strokeWidth={1.75} className="shrink-0 text-petrol-400" aria-hidden />
          <span className="text-xs text-cockpit-muted">
            Vorlage:{" "}
            <span className="font-medium text-cockpit-text">{templateName}</span>
          </span>
        </div>
      )}

      {/* Template selector (create mode — optional) */}
      {!isEdit && categoryTemplates.length > 0 && (
        <div className="space-y-1.5">
          <label
            htmlFor="template_id"
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-cockpit-muted"
          >
            <LayoutTemplate size={12} strokeWidth={1.75} aria-hidden />
            Vorlage auswählen
            <span className="ml-0.5 font-normal normal-case">(optional)</span>
          </label>
          <select
            id="template_id"
            name="template_id"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full rounded-md border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text focus:border-petrol-500 focus:outline-none"
          >
            <option value="">— Ohne Vorlage (freie Attribute) —</option>
            {categoryTemplates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
          {selectedTemplate && (
            <p className="text-xs text-cockpit-muted">
              Schlüssel:{" "}
              <span className="text-cockpit-text">
                {selectedTemplate.property_keys.join(" · ")}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Parent Bike (only for Parts) */}
      {showParent && (
        <div className="space-y-1.5">
          <label
            htmlFor="parent_id"
            className="block text-[11px] font-semibold uppercase tracking-widest text-cockpit-muted"
          >
            Zugeordnetes Bike
          </label>
          <select
            id="parent_id"
            name="parent_id"
            defaultValue={item?.parent_id ?? "none"}
            className="w-full rounded-md border border-cockpit-border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text focus:border-petrol-500 focus:outline-none"
          >
            <option value="none">— Keine Zuordnung —</option>
            {availableBikes.map((bike) => (
              <option key={bike.id} value={bike.id}>
                {bike.brand}
                {bike.model ? ` ${bike.model}` : ""}
              </option>
            ))}
          </select>
          {availableBikes.length === 0 && (
            <p className="text-xs text-cockpit-muted">
              Du hast noch keine Bikes angelegt – lege zuerst ein Bike an, um eine Zuordnung herzustellen.
            </p>
          )}
          {errors.parent_id && (
            <p className="text-xs text-red-400">{errors.parent_id}</p>
          )}
        </div>
      )}

      {/* Brand */}
      <FieldInput
        name="brand"
        label="Marke"
        required
        maxLength={80}
        defaultValue={item?.brand ?? ""}
        placeholder="z. B. Specialized"
        error={errors.brand}
      />

      {/* Model */}
      <FieldInput
        name="model"
        label="Modell"
        required
        maxLength={120}
        defaultValue={item?.model ?? ""}
        placeholder="z. B. S-Works Tarmac SL8"
        error={errors.model}
      />

      <ImageUploader initialUrl={item?.image_url ?? null} />

      <WeightField initialGrams={item?.weight_g ?? null} error={errors.weight_g} />

      <fieldset className="space-y-3 rounded-md border border-cockpit-border bg-cockpit-surface/60 p-4">
        <MetadataEditor
          key={selectedTemplateId || "free"}
          initial={
            templateInitialMeta ??
            (item?.metadata
              ? Object.fromEntries(
                  Object.entries(item.metadata as Record<string, unknown>).map(
                    ([k, v]) => [k, String(v)]
                  )
                )
              : undefined)
          }
        />
        {errors.metadata && (
          <p className="text-xs text-red-400">{errors.metadata}</p>
        )}
      </fieldset>

      {/* is_public */}
      <label className="flex items-start gap-3 rounded-md border border-cockpit-border bg-cockpit-surface p-3 text-sm">
        <input
          type="checkbox"
          name="is_public"
          defaultChecked={item?.is_public ?? false}
          className="mt-1 h-4 w-4 cursor-pointer accent-petrol-500"
        />
        <span>
          <span className="block font-medium text-cockpit-text">
            Für Follower sichtbar
          </span>
          <span className="block text-xs text-cockpit-muted">
            Greift nur, wenn auch dein Profil öffentlich ist.
          </span>
        </span>
      </label>

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
            ? isEdit
              ? "Speichern …"
              : "Anlegen …"
            : isEdit
              ? "Änderungen speichern"
              : "Item anlegen"}
        </button>
        <Link
          href="/garage"
          className="inline-flex items-center gap-2 rounded-md border border-cockpit-border px-4 py-2 text-sm text-cockpit-muted hover:text-cockpit-text"
        >
          <X size={16} strokeWidth={2} aria-hidden />
          Abbrechen
        </Link>
      </div>
    </form>
  );
}

interface DeleteItemFormProps {
  item: ItemRow;
}

export function DeleteItemForm({ item }: DeleteItemFormProps) {
  return (
    <form
      action={deleteItemAction}
      onSubmit={(e) => {
        if (!window.confirm(`"${item.brand} ${item.model}" wirklich löschen?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={item.id} />
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-md border border-red-900 bg-red-700/80 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600"
      >
        <Trash2 size={14} strokeWidth={2} aria-hidden />
        Löschen
      </button>
    </form>
  );
}

interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function FieldInput({ label, error, id, required, name, ...props }: FieldInputProps) {
  const inputId = id ?? name ?? label.toLowerCase();
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-[11px] font-semibold uppercase tracking-widest text-cockpit-muted"
      >
        {label}
        {required && (
          <span aria-hidden className="ml-1 text-petrol-400" title="Pflichtfeld">
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        name={name}
        required={required}
        aria-required={required || undefined}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${inputId}-err` : undefined}
        className={cn(
          "w-full rounded-md border bg-cockpit-surface px-3 py-2 text-sm text-cockpit-text placeholder:text-cockpit-muted",
          "transition-colors focus:outline-none focus:ring-0",
          error
            ? "border-red-700 focus:border-red-500"
            : "border-cockpit-border focus:border-petrol-500"
        )}
        {...props}
      />
      {error && (
        <p id={`${inputId}-err`} className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
