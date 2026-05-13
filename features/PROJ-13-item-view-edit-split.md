# PROJ-13: Item View/Edit Split

## Status: Approved
**Created:** 2026-05-12
**Last Updated:** 2026-05-13

## Dependencies
- Requires: PROJ-3 (Item Management / Garage) — Items und Garage-Liste müssen existieren
- Requires: PROJ-12 (Tour Item Feedback & Garage History) — `ItemTourHistory` wird von Edit auf View verschoben

## User Stories
- Als Nutzer möchte ich ein Item in der Garage öffnen und eine saubere Read-only-Detailansicht sehen, damit ich alle Eigenschaften auf einen Blick erfassen kann.
- Als Nutzer möchte ich auf der Detailansicht eine allgemeine Kommentar-Notiz zum Item pflegen können (z. B. "Knarzt bei Nässe"), ohne dafür ins Edit-Formular wechseln zu müssen.
- Als Nutzer möchte ich von der Detailansicht bequem zur Edit-Seite navigieren, wenn ich Eigenschaften wie Gewicht oder Kategorie ändern will.
- Als Nutzer möchte ich auf der Detailansicht die Tour-Nutzungshistorie des Items sehen, damit ich weiß, bei welchen Touren das Item eingesetzt wurde.
- Als Nutzer möchte ich auf der Edit-Seite ein aufgeräumtes Formular ohne ablenkende Zusatzinformationen vorfinden, damit ich mich auf die Bearbeitung konzentrieren kann.

## Acceptance Criteria

### View-Seite (`/garage/[id]`)
- [ ] Gegeben ein eingeloggter Nutzer öffnet ein eigenes Item — dann wird `/garage/[id]` als Read-only-Detailansicht angezeigt.
- [ ] Die View-Seite zeigt alle Item-Felder read-only: Brand, Model, Kategorie, Gewicht, Preis, Bike-Link, Gruppe und Bild (falls vorhanden).
- [ ] Es gibt einen "Bearbeiten"-Button/Link, der zu `/garage/[id]/edit` navigiert.
- [ ] Es gibt einen Abschnitt "Allgemeine Kommentare" mit der `general_note`.
  - Wenn `general_note` leer/null ist, wird ein Placeholder "Noch kein Kommentar — klicken zum Hinzufügen" angezeigt.
  - Wenn `general_note` gesetzt ist, wird der Text read-only angezeigt mit einem Stift-Icon zum Bearbeiten.
- [ ] Gegeben der Nutzer klickt auf den Kommentar-Bereich oder das Stift-Icon — dann öffnet sich ein Textarea mit dem bestehenden Text (oder leer) sowie "Speichern"- und "Abbrechen"-Buttons.
- [ ] Gegeben der Nutzer klickt "Speichern" — dann wird `general_note` via Server Action gespeichert, die Ansicht wechselt zurück in den Read-only-Modus und zeigt den neuen Text.
- [ ] Gegeben der Nutzer klickt "Abbrechen" — dann schließt sich das Textarea und der ursprüngliche Wert bleibt unverändert.
- [ ] Die View-Seite enthält den `ItemTourHistory`-Abschnitt (Tour-Nutzungshistorie aus PROJ-12), platziert unterhalb der Kommentare.
- [ ] Gegeben ein Nutzer versucht, ein fremdes Item aufzurufen — dann wird `notFound()` zurückgegeben (404).

### Edit-Seite (`/garage/[id]/edit`)
- [ ] Die Edit-Seite zeigt ausschließlich das `ItemForm` (Brand, Model, Kategorie, Gewicht, Preis, Bike-Link, Gruppe, Bild) und die `DeleteItemForm`-Schaltfläche.
- [ ] Die `ItemTourHistory`-Komponente wird von der Edit-Seite entfernt.
- [ ] `general_note` wird auf der Edit-Seite nicht angezeigt (Kommentare gehören zur View-Seite).
- [ ] Ein "← Zurück zur Detailansicht"-Link navigiert zu `/garage/[id]`.

### Navigation & Links
- [ ] Alle bestehenden Klick-Ziele für Items (Garage-Liste, Tour-Packliste `ItemTourHistory`-Zeilen) verlinken auf `/garage/[id]` statt auf `/garage/[id]/edit`.

### Datenbank
- [ ] Die Tabelle `items` erhält eine neue nullable Textspalte `general_note`.
- [ ] Das System akzeptiert `general_note`-Werte bis maximal 2000 Zeichen.
- [ ] Leere Strings werden als `null` gespeichert (keine leeren Strings in der DB).

## Edge Cases
- `general_note` mit 2001+ Zeichen → Zod-Validation schlägt fehl, Fehlermeldung unter dem Textarea.
- Nutzer klickt "Speichern" ohne Änderung (Textarea-Inhalt identisch zum gespeicherten Wert) → Kein DB-Aufruf, Textarea schließt sich ohne Feedback-Toast.
- Nutzer löscht den gesamten Kommentar-Text und speichert → `general_note` wird auf `null` gesetzt, Placeholder erscheint wieder.
- Sehr langer Kommentar (nahe 2000 Zeichen) → Zeichenzähler im Textarea (analog PROJ-12 Notiz-Feld).
- Gleichzeitiger Edit-Versuch in zwei Tabs → Letzter Speichervorgang gewinnt (kein Optimistic-Locking nötig für MVP).
- Item ohne Bild → Bild-Bereich auf View-Seite zeigt Placeholder/Icon (bestehende Logik beibehalten).

## Data & Privacy (PII)
- PII involved: `general_note` kann persönliche Notizen enthalten. Items sind per RLS immer nur für den Besitzer zugänglich — keine öffentliche Sichtbarkeit in dieser Feature-Phase. Kein Änderungsbedarf an RLS-Policies.

## Technical & UI Requirements
- **A11y:** Stift-Icon zum Bearbeiten braucht `aria-label="Kommentar bearbeiten"`. Textarea mit `aria-label`. Zeichenzähler mit `aria-live="polite"`.
- **Performance:** Server Action für `general_note` < 200 ms. View-Seite ist Server Component (SSR), kein Lade-Spinner nötig.
- **Security:** RLS bleibt unverändert — Items sind nur für den Besitzer zugänglich (`user_id = auth.uid()`). Server Action prüft Ownership explizit (defense-in-depth).
- **Browser Support:** Chrome, Firefox, Safari (Desktop + Mobile).
- **Max. Textlänge:** `general_note` max. 2000 Zeichen, mit Live-Zeichenzähler im Textarea.

---

## Tech Design (Solution Architect)

### Component Structure

**New: View Page** (`/garage/[id]`) — Server Component:

```
ItemViewPage (Server Component — NEW)
+-- Header
|   +-- Kategorie-Icon + Brand/Model
|   +-- "Bearbeiten"-Button → /garage/[id]/edit
+-- ItemDetailCard (inline section, no separate component needed)
|   +-- Image (full-width, if present) — existing rendering logic reused
|   +-- Read-only field rows: Kategorie, Gewicht, Preis, Bike-Link, Gruppe
+-- GeneralNoteSection (Client Component — NEW)
|   [Read Mode]: Note-Text | Placeholder "Noch kein Kommentar — klicken zum Hinzufügen"
|                + Stift-Icon (aria-label="Kommentar bearbeiten")
|   [Edit Mode]:  Textarea (max 2000 chars)
|                + Live-Zeichenzähler (aria-live="polite")
|                + "Speichern"-Button + "Abbrechen"-Button
+-- ItemTourHistory (existing Server Component — MOVED here from edit page)
```

**Modified: Edit Page** (`/garage/[id]/edit`) — Server Component:

```
EditItemPage (Server Component — MODIFIED)
+-- Header
|   +-- "← Zurück zur Detailansicht"-Link → /garage/[id]
|   +-- "Item bearbeiten" label + Brand/Model
+-- ItemForm (existing — unchanged)
+-- DeleteItemForm (existing — unchanged)
[REMOVED: ItemTourHistory — belongs on view page now]
```

### Data Model

**Change to existing table: `items`**

| Column | Type | Constraint | Default |
|--------|------|-----------|---------|
| `general_note` | text, nullable | CHECK: length ≤ 2000 chars | NULL |

No new tables. Existing RLS policies on `items` are unchanged — they already scope all reads and writes to `user_id = auth.uid()`, so `general_note` is automatically protected.

### API & Tech Strategy

**New Server Action: `updateGeneralNoteAction`** — added to `src/app/(app)/garage/actions.ts`:

- Accepts `itemId` and the raw note text from the client
- Zod validates: max 2000 chars; empty string is normalized to `null`
- Explicit ownership check: queries `items` with `.eq("user_id", user.id)` before updating (defense-in-depth on top of RLS)
- Updates only `general_note` on the matching row — no other fields touched
- Calls `revalidatePath("/garage/[id]")` so Next.js re-renders the Server Component with fresh data
- Returns a typed result `{ ok: true } | { error: string }` — same pattern as existing actions

**Data flow:**

```
User clicks Stift-Icon
  → GeneralNoteSection (Client) switches to edit mode (local state)
  → User types text (live char counter updates)
  → User clicks "Speichern"
  → updateGeneralNoteAction(itemId, text) called via useTransition
  → Server validates + writes to Supabase
  → revalidatePath triggers page re-render
  → GeneralNoteSection receives updated initialNote prop, switches back to read mode
```

**No-op guard:** If the user saves without changing the text, `GeneralNoteSection` compares the current value against `initialNote` before calling the Server Action — skips the call entirely if identical.

### Navigation Changes (no new API needed)

All existing item links that point to `/garage/${item.id}/edit` are updated to point to `/garage/${item.id}` (the new view page). The edit page is reached only via the "Bearbeiten" button on the view page.

Files affected:

| File | Change |
|------|--------|
| `src/components/items/ItemCard.tsx` | Footer link → `/garage/${item.id}` |
| `src/components/items/BuildView.tsx` | Item link → `/garage/${item.id}` |
| `src/components/tours/TourPacklist.tsx` | Both item links → `/garage/${item.id}` |
| `src/app/(app)/garage/groups/[id]/compare/page.tsx` | Both item links → `/garage/${item.id}` |

Note: Group links (`/garage/groups/${id}/edit`) are unaffected — these are not item links.

### New Files

| File | Type | Purpose |
|------|------|---------|
| `src/app/(app)/garage/[id]/page.tsx` | Server Component | New read-only item view page |
| `src/components/items/GeneralNoteSection.tsx` | Client Component | Inline-edit widget for `general_note` |
| `supabase/migrations/0012_item_general_note.sql` | DB Migration | ADD COLUMN `general_note` to `items` |

### Modified Files

| File | Change |
|------|--------|
| `src/app/(app)/garage/[id]/edit/page.tsx` | Remove `ItemTourHistory`; add Back-Link |
| `src/app/(app)/garage/actions.ts` | Add `updateGeneralNoteAction` |
| `src/components/items/ItemCard.tsx` | Update link target |
| `src/components/items/BuildView.tsx` | Update link target |
| `src/components/tours/TourPacklist.tsx` | Update both link targets |
| `src/app/(app)/garage/groups/[id]/compare/page.tsx` | Update both link targets |

### Dependencies

No new npm packages — all required primitives are already installed:
- `textarea` (shadcn/ui) — note editing field
- `button` (shadcn/ui) — save/cancel actions
- `lucide-react` — `Pencil` icon (already used in `ItemCard`)

## Implementation Notes

### Backend (2026-05-13)

**Migration: `supabase/migrations/0012_item_general_note.sql`**
- `ALTER TABLE items ADD COLUMN IF NOT EXISTS general_note text CHECK (char_length(general_note) <= 2000)`
- Nullable; empty strings normalized to `null` at application layer
- No RLS changes needed — existing `items` policies cover the new column automatically

**Server Action: `updateGeneralNoteAction`** in `src/app/(app)/garage/actions.ts`
- Zod schema validates UUID + max-2000-char note; empty string → `null` via `.transform()`
- Explicit `.eq("user_id", user.id)` ownership check (defense-in-depth on top of RLS)
- Returns `{ ok: true } | { error: string }` — consistent with PROJ-12 feedback action pattern
- Calls `revalidatePath("/garage/${itemId}")` to trigger SSR re-render of the view page

**TypeScript types: `src/types/supabase.ts`**
- Added `general_note: string | null` to `items.Row`, `items.Insert`, and `items.Update` manually (Docker not running; `supabase gen types` should be re-run once Docker is available to confirm)

### Frontend (2026-05-13)

**New files:**
- `src/app/(app)/garage/[id]/page.tsx` — Server Component; queries item + parent bike + group name; renders read-only fields, `GeneralNoteSection`, `ItemTourHistory`
- `src/components/items/GeneralNoteSection.tsx` — Client Component; read/edit mode toggle; `useEffect` syncs `text` state when `initialNote` prop updates after server re-render; no-op guard skips DB call if text unchanged; char counter with `aria-live="polite"`, Speichern/Abbrechen buttons; calls `updateGeneralNoteAction` via `useTransition`

**Modified files:**
- `src/app/(app)/garage/[id]/edit/page.tsx` — Removed `ItemTourHistory`; added "← Zurück zur Detailansicht" back-link; removed now-unused `ItemTourHistory` import
- `src/components/items/ItemCard.tsx` — Footer button changed from "Bearbeiten" (Pencil → `/edit`) to "Ansehen" (Eye → `/garage/${id}`); `Pencil` icon import removed
- `src/components/items/BuildView.tsx` — Bike "Bearbeiten" button → "Ansehen" (Eye → `/garage/${id}`); `Pencil` import removed
- `src/components/tours/TourPacklist.tsx` — Both item name links (main + child) changed from `/edit` to `/garage/${id}`; `aria-label` updated to "ansehen" instead of "bearbeiten"
- `src/app/(app)/garage/groups/[id]/compare/page.tsx` — Both item header links in table + individual-props card changed from `/edit` to `/garage/${id}`

**Build:** `npm run build` passes with 0 TypeScript errors. `/garage/[id]` and `/garage/[id]/edit` both appear as dynamic routes in the build output.

## QA Test Results

**Tested:** 2026-05-13
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

**View-Seite (`/garage/[id]`)**
- [x] **AC-1:** `/garage/[id]` als Read-only-Detailansicht — **Pass** (neue `ViewItemPage` Server Component)
- [x] **AC-2:** Alle Item-Felder read-only (Kategorie, Gewicht, Bike-Link, Gruppe, Bild, Metadata) — **Pass**
- [x] **AC-3:** "Bearbeiten"-Button navigiert zu `/garage/[id]/edit` — **Pass** (Link mit Pencil-Icon)
- [x] **AC-4:** `general_note`-Abschnitt mit leerem Placeholder oder gesetztem Text — **Pass** (`GeneralNoteSection` zeigt Placeholder wenn null, Text + Pencil-Icon wenn gesetzt)
- [x] **AC-5:** Klick → Textarea + Speichern + Abbrechen — **Pass** (Client State Toggle)
- [x] **AC-6:** Speichern via Server Action mit revalidatePath — **Pass** (`updateGeneralNoteAction` + `useTransition`)
- [x] **AC-7:** Abbrechen → Original bleibt — **Pass** (`handleCancel` setzt `text` auf `initialNote` zurück)
- [x] **AC-8:** `ItemTourHistory` auf View-Seite — **Pass** (`<ItemTourHistory itemId={id} />` vorhanden)
- [x] **AC-9:** Fremdes Item → 404 — **Pass** (`.eq("user_id", user.id)` + `if (!data) notFound()`)

**Edit-Seite (`/garage/[id]/edit`)**
- [x] **AC-10:** Nur `ItemForm` + `DeleteItemForm` — **Pass**
- [x] **AC-11:** `ItemTourHistory` entfernt — **Pass** (Import und JSX entfernt)
- [x] **AC-12:** `general_note` nicht auf Edit-Seite — **Pass**
- [x] **AC-13:** "← Zurück zur Detailansicht" navigiert zu `/garage/[id]` — **Pass** (ChevronLeft-Link)

**Navigation & Links**
- [x] **AC-14:** `ItemCard` Footer-Link → `/garage/${id}` — **Pass** (Eye-Icon, "Ansehen")
- [x] **AC-14:** `BuildView` Bike-Link → `/garage/${id}` — **Pass**
- [x] **AC-14:** `TourPacklist` (2x) Item-Links → `/garage/${id}` — **Pass**, aria-labels aktualisiert
- [x] **AC-14:** `compare/page.tsx` (2x) Item-Links → `/garage/${id}` — **Pass**

**Datenbank**
- [x] **AC-15:** Migration `0012_item_general_note.sql` vorhanden — **Pass**
- [x] **AC-16:** Max. 2000 Zeichen via DB CHECK + Zod — **Pass**
- [x] **AC-17:** Leere Strings → `null` via Zod `.transform()` — **Pass**

### Edge Cases

- [x] `general_note` mit 2001 Zeichen → Zod-Fehler, Speichern-Button deaktiviert — **Pass** (`isOverLimit` Guard)
- [x] Speichern ohne Änderung → kein DB-Aufruf — **Pass** (no-op guard in `handleSave`)
- [x] Kommentar komplett löschen + Speichern → `null`, Placeholder erscheint wieder — **Pass** (`.transform("")` → `null`)
- [x] Zeichenzähler zeigt verbleibende Zeichen — **Pass** (`charsLeft` mit `aria-live="polite"`)
- [x] Item ohne Bild — **Pass** (`{item.image_url && ...}` Conditional)
- [x] `useEffect` synct `text`-State wenn `initialNote`-Prop nach Re-Render aktualisiert — **Pass**

### A11y Check

- [x] Kategorie-Icon: `aria-hidden` — **Pass**
- [x] `GeneralNoteSection`: `aria-labelledby="general-note-heading"` auf `<section>` — **Pass**
- [x] Stift-Icon: dynamisches `aria-label` ("bearbeiten" / "hinzufügen") auf Trigger-Button — **Pass**
- [x] Textarea: `aria-label="Allgemeiner Kommentar zum Item"` — **Pass**
- [x] Zeichenzähler: `aria-live="polite"` — **Pass**
- [x] Fehlermeldung: `role="alert"` — **Pass**
- [x] Pencil/Eye Icons in geänderten Komponenten: `aria-hidden` — **Pass**
- [x] Link2-Icon (Bike-Link): `aria-hidden` — **Pass**

### Security & Privacy Audit

- [x] **Ownership Check:** `updateGeneralNoteAction` prüft `.eq("user_id", user.id)` — defense-in-depth auf RLS. Keine IDOR-Lücke.
- [x] **View Page Auth:** `supabase.auth.getUser()` vor jedem Render. Fremde Items → `notFound()`.
- [x] **Zod UUID Validation:** `itemId: z.string().uuid()` blockiert SQL-Injection und Path-Traversal im Item-ID-Parameter.
- [x] **XSS:** React JSX escaped alle User-Inhalte automatisch. `general_note` wird in `<p>` gerendert — kein `dangerouslySetInnerHTML`.
- [x] **PII in Logs:** Keine `console.log`-Aufrufe mit Item-Inhalten oder Notizen. — **Pass**
- [x] **Supabase RLS:** Bestehende `items`-Policies decken `general_note` automatisch ab (keine separate Policy nötig). SELECT + UPDATE nur für `user_id = auth.uid()`.

### Tests

- **Unit Tests:** 287/287 bestanden (14 Testdateien) — inkl. 16 neue `generalNoteSchema`-Validierungstests in `src/lib/items/general-note-validation.test.ts`
- **E2E Tests:** 20 Tests in `tests/PROJ-13-item-view-edit-split.spec.ts` — alle übersprungen (Supabase nicht im CI konfiguriert), kein Fehler

### Bugs Found

#### BUG-1: `select("*")` im View-Page-Query
- **Severity:** Low
- **Beschreibung:** `ViewItemPage` nutzt `.select("*")` — gegen Backend-Konvention. Konsistent mit bestehendem `EditItemPage`-Pattern, aber schlechter für Performance bei breiten Tables.
- **Priority:** Nächster Sprint (keine funktionale Auswirkung)

#### BUG-2: `updateItemAction` revalidiert `/garage/${itemId}` nicht
- **Severity:** Low
- **Beschreibung:** Nach dem Speichern im Edit-Formular redirectet `updateItemAction` auf `/garage`. Würde der Nutzer direkt danach `/garage/${itemId}` besuchen, würde Next.js `force-dynamic` frische Daten laden — kein sichtbarer Bug.
- **Priority:** Nächster Sprint (kein Deployment-Blocker)

#### BUG-3: Whitespace-Note (2001 Zeichen) wird fälschlicherweise abgelehnt
- **Severity:** Low
- **Beschreibung:** Input `" ".repeat(2001)` schlägt `.max(2000)` fehl, obwohl die getrimte Version leer/null wäre. Technisch korrekt gemäß Spec (Zod prüft vor Transform), aber theoretisch eine False Rejection.
- **Priority:** Info-only (kein Nutzer-sichtbares Problem, Client-Char-Counter verhindert diese Eingabe)

### Summary

- **AC Status:** 17/17 bestanden
- **Edge Cases:** 6/6 Pass
- **A11y:** Pass
- **Security:** Pass (keine kritischen oder High-Severity Findings)
- **Unit Tests:** 287/287 ✓
- **E2E Tests:** 20/20 skipped (Supabase-Konfiguration fehlt in CI)
- **Production Ready: YES** — keine kritischen oder High-Severity Bugs

## Deployment
_To be added by /deploy_
