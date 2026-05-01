# PROJ-8: Item Templates & Comparison

## Status: Architected
**Created:** 2026-05-01
**Last Updated:** 2026-05-01

## Dependencies
- Requires: PROJ-1 (Authentication) — templates are always user-owned
- Requires: PROJ-3 (Item Management / Garage) — templates extend the existing `items` table and metadata system

## Summary
Users can create **templates** within a category (e.g. "Gear") that define a fixed set of property keys. Items created from a template always have the same keys — only the values differ. This enables reliable side-by-side comparison of similar items (e.g. three saddle bags). When a template is updated, all linked items are updated automatically with a confirmation modal warning the user about destructive changes.

---

## User Stories

- Als Nutzer möchte ich eine Vorlage innerhalb einer Kategorie anlegen, damit ich gleichartige Items mit denselben Eigenschaften erfassen kann.
- Als Nutzer möchte ich ein Item aus einer Vorlage erstellen, damit die Eigenschaften automatisch vorausgefüllt sind und ich nur noch Werte eingeben muss.
- Als Nutzer möchte ich weiterhin freie Items ohne Vorlage anlegen können, damit bestehende Workflows unverändert bleiben.
- Als Nutzer möchte ich eine Vorlage bearbeiten können, damit ich neue Eigenschaften hinzufügen oder bestehende entfernen kann.
- Als Nutzer möchte ich gewarnt werden, wenn meine Vorlagenänderung Auswirkungen auf bereits erstellte Items hat, damit ich keine Daten versehentlich verliere.
- Als Nutzer möchte ich beim Entfernen eines Schlüssels aus einer Vorlage wählen können, ob der Wert in betroffenen Items gelöscht oder als "waiser Wert" behalten wird, damit ich selbst über Datenverlust entscheide.
- Als Nutzer möchte ich alle Items aus einer Vorlage in einer Tabellenansicht nebeneinander sehen, damit ich sie direkt vergleichen kann.

---

## Acceptance Criteria

### Vorlagen-Verwaltung

- [ ] **Given** ich bin eingeloggt, **when** ich auf der /garage-Seite auf "Vorlagen verwalten" klicke, **then** sehe ich eine Liste meiner Vorlagen gruppiert nach Kategorie.
- [ ] **Given** ich eine neue Vorlage erstelle, **when** ich Kategorie, Name und mindestens einen Eigenschaftsschlüssel eingegeben habe, **then** wird die Vorlage gespeichert und ist sofort für die Item-Erstellung verfügbar.
- [ ] **The system shall** sicherstellen, dass Vorlagen immer genau einer Kategorie zugeordnet sind (Bike, Part, Gear, Clothing).
- [ ] **The system shall** sicherstellen, dass Vorlagennamen pro Nutzer und Kategorie eindeutig sind (kein Duplikat innerhalb derselben Kategorie desselben Nutzers).
- [ ] **Given** ich eine Vorlage lösche, **then** werden alle verknüpften Items von der Vorlage getrennt (sie werden zu freien Items) — keine Datenlöschung an Items.
- [ ] **The system shall** Vorlagen ausschließlich pro Nutzer speichern (kein globales Teilen von Vorlagen in PROJ-8).

### Items aus Vorlagen erstellen

- [ ] **Given** ich ein neues Item anlege, **when** ich eine Kategorie auswähle, **then** kann ich optional eine bestehende Vorlage für diese Kategorie auswählen.
- [ ] **Given** ich eine Vorlage ausgewählt habe, **then** sind die Eigenschaftsschlüssel der Vorlage im MetadataEditor vorausgefüllt (leere Werte), und der Nutzer gibt nur die Werte ein.
- [ ] **The system shall** das Item mit einer `template_id` speichern, um die Verknüpfung zur Vorlage dauerhaft zu erhalten.
- [ ] **Given** ich kein Vorlage wähle, **then** verhält sich die Item-Erstellung exakt wie bisher (freie Metadaten).

### Vorlagenänderungen & Propagierung

- [ ] **Given** ich eine Vorlage bearbeite und speichere, **when** mindestens ein verlinktes Item existiert, **then** erscheint ein Modal, das alle Änderungen auflistet (hinzugefügte Schlüssel, entfernte Schlüssel, umbenannte Schlüssel).
- [ ] **Given** ich im Propagierungs-Modal bestätige, **then** werden alle verknüpften Items entsprechend aktualisiert:
  - Neu hinzugefügte Schlüssel: werden allen verlinkten Items mit leerem Wert hinzugefügt.
  - Entfernte Schlüssel: Nutzer wählt pro entferntem Schlüssel im Modal: **"Löschen"** (Standard, Wert wird aus allen Items entfernt) oder **"Als waiser Wert behalten"** (Wert bleibt am Item, ist aber nicht mehr Teil der Vorlage).
  - Umbenannte Schlüssel (alter Name → neuer Name): werden wie Entfernen des alten + Hinzufügen des neuen Schlüssels behandelt (Nutzer entscheidet über den alten Wert).
- [ ] **Given** ich keine verlinkten Items habe, **then** wird die Vorlage ohne Modal sofort gespeichert.
- [ ] **Given** ich das Propagierungs-Modal schließe oder abbricht, **then** wird die Vorlage **nicht** gespeichert.

### Vergleichsansicht

- [ ] **Given** ich eine Vorlage mit mindestens 2 verlinkten Items öffne, **then** kann ich eine Vergleichsansicht aufrufen.
- [ ] **The system shall** die Vergleichstabelle so aufbauen: Eigenschaften = Zeilen, Items = Spalten.
- [ ] **Given** ein verlinktes Item einen "waisen Wert" (nicht mehr in Vorlage) besitzt, **then** wird dieser Wert in der Vergleichstabelle **nicht** angezeigt (nur Vorlage-Schlüssel werden verglichen).
- [ ] **Given** ein verlinktes Item einen Vorlage-Schlüssel noch nicht gesetzt hat, **then** zeigt die Zelle "—".
- [ ] **The system shall** in der Vergleichstabelle **nur Items aus derselben Vorlage** anzeigen (keine freien Items).

---

## Edge Cases

- **Vorlage ohne Items löschen:** Kein Modal nötig — direkte Löschung ohne Warnung.
- **Vorlage mit Items löschen:** Nutzer wird gewarnt, dass Items zu freien Items werden. Kein Datenverlust.
- **Item aus Vorlage manuell mit extra Schlüsseln ergänzen:** Erlaubt — freie Zusatzfelder am Item sind möglich. Sie erscheinen nicht in der Vergleichsansicht, da sie kein Vorlage-Schlüssel sind.
- **Vorlagenname-Duplikat in derselben Kategorie:** Server-Validierung schlägt fehl mit deutschem Fehlertext ("Eine Vorlage mit diesem Namen existiert bereits in dieser Kategorie.").
- **Vorlage mit 0 Schlüsseln speichern:** Nicht erlaubt — Validierung erfordert mindestens 1 Schlüssel.
- **Schlüssel-Name leer oder nur Leerzeichen:** Nicht erlaubt — wird auf Server getrimmt und abgelehnt.
- **Schlüssel-Duplikat innerhalb einer Vorlage:** Nicht erlaubt — Schlüsselnamen innerhalb einer Vorlage müssen eindeutig sein.
- **Vergleichsansicht mit nur 1 verlinktem Item:** Vergleichs-Button ist deaktiviert / nicht angezeigt (Minimum: 2 Items).
- **Nutzer navigiert zu /garage/templates/[id] einer fremden Vorlage:** 404 (`.eq("user_id", user.id)` Guard).
- **Propagierungs-Update schlägt teilweise fehl (DB-Fehler):** Transaktion oder sequenzielles Update mit Rollback-Hinweis — keine Teilaktualisierung von Items.

---

## Data & Privacy (PII)

- PII involved: None. Vorlagen enthalten nur Schlüsselnamen und Kategorie — keine personenbezogenen Daten.
- Vorlagen sind immer privat (kein `is_public`-Flag in PROJ-8).

---

## Technical & UI Requirements

- **A11y:** Modal-Dialoge sind fokus-trappt und per Escape schließbar. Tabellen-Vergleich hat `<th scope="col">` für Screenreader.
- **Performance:** Propagierungs-Update auf alle verlinkten Items läuft als einzelne DB-Operation (UPDATE WHERE template_id = X AND id = ANY([...])), kein N+1.
- **Security:** `user_id` wird immer aus der Server-Session gezogen. Vorlagen-ID in Mutations wird gegen `user_id` geprüft (`WHERE id = X AND user_id = auth.uid()`). RLS auf `item_templates`-Tabelle.
- **Browser Support:** Chrome, Firefox, Safari

---

<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
**Designed: 2026-05-01**

### A) Component Structure

```
/garage (existing — header modified)
+-- GarageHeader
    +-- "Vorlagen" link → /garage/templates  [NEW]

/garage/templates  (Server Page — lists all user templates)
+-- TemplatesHeader ("Vorlagen verwalten", "Neue Vorlage" button → /garage/templates/new)
+-- [if no templates] EmptyState
+-- TemplateListGrouped  (grouped by category: Bike / Part / Gear / Clothing)
    +-- CategorySection (per category that has templates)
        +-- TemplateCard  (name · key count · linked item count)
            +-- "Bearbeiten" link → /garage/templates/[id]/edit
            +-- "Vergleichen" link → /garage/templates/[id]/compare
            |     (disabled + tooltip "Mindestens 2 Items nötig" when linked items < 2)
            +-- DeleteTemplateButton (client — shows confirmation dialog)
                  If linked items > 0: warns "X Items werden zu freien Items"

/garage/templates/new  (Server Page)
+-- Heading + back link to /garage/templates
+-- TemplateForm  (client, create mode)
    +-- CategorySelect  (native <select>: Bike / Part / Gear / Clothing)
    +-- NameInput  (text, max 80 chars, unique within category enforced server-side)
    +-- TemplateKeyEditor  (client — key-only rows, no values)
    |   +-- Key rows (text input per key, max 40 chars)
    |   +-- "Schlüssel hinzufügen" button
    |   +-- Row-level delete buttons
    +-- "Vorlage anlegen" button

/garage/templates/[id]/edit  (Server Page — loads template + linked item count)
+-- Heading + back link to /garage/templates
+-- TemplateForm  (client, edit mode, pre-filled with original data)
    +-- [same fields as create mode, pre-filled]
    +-- PropagationModal  (shadcn Dialog — shown on save when linkedItemCount > 0 AND diff ≠ empty)
    |   +-- Section "Neu hinzugefügt": list of added keys
    |   +-- Section "Entfernt": per removed key →
    |   |     Radio group: ● Löschen (Standard) / ○ Als waiser Wert behalten
    |   +-- "Bestätigen" / "Abbrechen" buttons
    +-- "Änderungen speichern" button
+-- DeleteTemplateSection  (separate — with linked-items warning, same pattern as PROJ-3 delete)

/garage/templates/[id]/compare  (Server Page — loads template + all linked items)
+-- ComparisonHeader  (template name, category badge, item count, ← back link)
+-- ScrollArea  (horizontal scroll for narrow screens — shadcn ScrollArea)
    +-- ComparisonTable  (shadcn Table)
        +-- <thead>
        |   +-- <th scope="col">Eigenschaft</th>
        |   +-- <th scope="col">{item.brand} {item.model}</th>  (one per item)
        +-- <tbody>
            +-- <tr> per key in template.property_keys
                +-- <th scope="row">{key}</th>
                +-- <td>{item.metadata[key] ?? "—"}</td>  (one per item)

/garage/new  (existing — modified)
+-- ItemForm  (receives allUserTemplates prop from server page)
    +-- CategorySelect  (existing — triggers TemplateSelector filter)
    +-- TemplateSelector  [NEW — optional, shown after category selected]
    |   +-- "Vorlage auswählen (optional)" shadcn Select
    |   +-- Filters allUserTemplates by selected category client-side
    |   +-- On selection: MetadataEditor resets with template keys (empty values)
    |   +-- Hidden input: name="template_id"
    +-- MetadataEditor  (existing — pre-populated with template keys when template chosen)
    +-- [all other existing fields unchanged]

/garage/[id]/edit  (existing — minor addition)
+-- ItemForm  (receives templateName prop if item has template_id)
    +-- [NEW read-only badge] "Vorlage: {templateName}" (if template_id set)
    +-- [all other existing fields unchanged — no template re-assignment in MVP]
```

---

### B) Data Model

**New table: `item_templates`**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto-generated |
| user_id | UUID FK → profiles.id | ON DELETE CASCADE |
| category | item_category ENUM | Bike / Part / Gear / Clothing |
| name | TEXT NOT NULL | max 80 chars |
| property_keys | TEXT[] NOT NULL | ordered list of key names; min 1, max 25 |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | auto-updated by existing trigger |

**Constraints:**
- Unique: (user_id, category, name) — no duplicate template names per user per category
- Check: array_length(property_keys) between 1 and 25

**Indexes:**
- `item_templates_user_id_idx` on (user_id)
- `item_templates_user_cat_idx` on (user_id, category) — for fast filtering by category

**Security (RLS):**
- SELECT: user_id = auth.uid() — templates are always private
- INSERT: user_id = auth.uid()
- UPDATE: user_id = auth.uid()
- DELETE: user_id = auth.uid()

---

**Modified table: `items`** (migration addendum)

| New Column | Type | Notes |
|------------|------|-------|
| template_id | UUID NULL FK → item_templates(id) | ON DELETE SET NULL — item becomes free when template deleted |

**New index:** `items_template_id_idx` on (template_id) — for fast "all items from this template" queries

---

### C) API & Tech Strategy

**Migration:** One new migration file `0005_item_templates.sql`:
- Creates `item_templates` table with RLS
- Adds `template_id` column to `items`
- Adds index on `items.template_id`

**Server Actions in `src/app/garage/templates/actions.ts`:**

| Action | Behaviour |
|--------|-----------|
| `createTemplateAction` | Validate (name, category, keys uniqueness/length) → INSERT item_templates with `user_id = session.user.id` → redirect /garage/templates |
| `updateTemplateAction(id)` | Validate → verify ownership → UPDATE item_templates → propagate JSONB changes to all linked items (see propagation strategy below) → redirect /garage/templates |
| `deleteTemplateAction(id)` | Verify ownership → DELETE item_templates (FK ON DELETE SET NULL handles items automatically) → redirect /garage/templates |

**Propagation strategy inside `updateTemplateAction`:**

The Server Action receives: new `property_keys` array + `removedKeysDecision` object `{ [key]: 'delete' | 'keep' }` for each removed key (sent from client via form fields).

The action:
1. Loads current `property_keys` from DB (to compute authoritative diff, not trusting client diff)
2. Computes: `addedKeys = newKeys − oldKeys`, `removedKeys = oldKeys − newKeys`
3. For each **added key**: runs `UPDATE items SET metadata = metadata || '{"key": ""}' WHERE template_id = $id AND user_id = $uid`
4. For each **removed key where decision = 'delete'**: runs `UPDATE items SET metadata = metadata - 'key' WHERE template_id = $id AND user_id = $uid`
5. For each **removed key where decision = 'keep'**: no update (waiser Wert stays in items)
6. Updates `item_templates` with new `property_keys`

All UPDATE calls include `.eq("user_id", uid)` as defense-in-depth. If any step fails, the Server Action returns an error state without committing partial changes (PostgreSQL JSONB operations are atomic per row; the Supabase client does not auto-roll back multiple calls — a DB error at step 4 still leaves step 3's changes applied, so the UX should surface the error clearly and the template update itself is not persisted).

**PropagationModal flow (client):**
- `TemplateForm` receives `originalKeys: string[]` and `linkedItemCount: number` as props from the server page
- On "Änderungen speichern" click: client computes diff between `originalKeys` and current form key list
- If `linkedItemCount > 0` AND diff is non-empty: show PropagationModal, do NOT submit yet
- User sets per-key decisions (delete/keep) via Radio in modal
- On "Bestätigen": submit form including hidden inputs `removed_key_decision[key]=delete|keep`
- On "Abbrechen": close modal, form stays in edit mode (not submitted)

**ItemForm changes (`src/components/items/ItemForm.tsx`):**
- Server pages (`/garage/new`, `/garage/[id]/edit`) load all user's templates once, pass as `templates` prop
- `TemplateSelector` client sub-component filters `templates` by `selectedCategory` and renders a `shadcn Select`
- On template selection: MetadataEditor is re-initialised via a state reset with the template's keys as rows (empty values), maintaining the existing `seedRows()` pattern

**`/garage/new` page** loads templates server-side: `SELECT id, name, category, property_keys FROM item_templates WHERE user_id = $uid ORDER BY category, name`

**Validation (all server-side):**
- Template name: trimmed, 1–80 chars, unique per (user_id, category)
- property_keys: 1–25 entries, each trimmed, non-empty, max 40 chars, no duplicates within the array
- template_id on item create/update: must be a valid UUID that belongs to the user (if provided)

---

### D) Dependencies

No new npm packages required. All needed shadcn/ui components are already installed:

| Component | Already installed? | Used for |
|-----------|-------------------|----------|
| shadcn Dialog | ✅ | PropagationModal |
| shadcn Table | ✅ | ComparisonTable |
| shadcn ScrollArea | ✅ | Horizontal scroll on compare page |
| shadcn Select | ✅ | TemplateSelector in ItemForm |
| shadcn Radio Group | ✅ | delete/keep decision per removed key |

## Implementation Notes
<!-- REQUIRED BY GENERAL RULES: Document what was built and any deviations from this spec -->
- 

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
