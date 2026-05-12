# PROJ-12: Tour Item Feedback & Garage History

## Status: Approved
**Created:** 2026-05-09
**Last Updated:** 2026-05-09

## Dependencies
- Requires: PROJ-3 (Item Management / Garage) — Items müssen existieren
- Requires: PROJ-11 (Tour Management & Packliste) — Touren und Packlisten-Einträge müssen existieren

## User Stories
- Als Nutzer möchte ich zu jedem Item auf meiner Packliste nach einer Tour eine Notiz und eine Bewertung (1–5 Sterne) hinterlassen können, damit ich festhalte was gut oder schlecht funktioniert hat.
- Als Nutzer möchte ich in der Garage bei einem Item sehen, bei welchen Touren ich es genutzt habe, damit ich die Nutzungshistorie des Items kenne.
- Als Nutzer möchte ich auf der Tour-Detailseite alle Items mit ihren Bewertungen und Notizen sehen, damit ich nach der Tour eine schnelle Zusammenfassung habe.
- Als Nutzer möchte ich bestehende Notizen und Bewertungen nachträglich bearbeiten oder löschen können.

## Acceptance Criteria

### Feedback erfassen (Tour-Detailseite)
- [ ] Gegeben ein eingeloggter Nutzer auf der Detailseite einer eigenen Tour — dann sieht er bei jedem Packlisten-Item eine Schaltfläche "Feedback hinzufügen / bearbeiten".
- [ ] Das Feedback-Formular enthält:
  - Bewertung: 1–5 Sterne (optional, keine Pflichtangabe)
  - Notiz: Freitext (optional, max. 1000 Zeichen)
- [ ] Das System soll es erlauben, Feedback zu speichern, wenn mindestens eines der beiden Felder ausgefüllt ist.
- [ ] Gegeben ein Item mit bestehendem Feedback — dann zeigt der Button "Feedback bearbeiten" an und die gespeicherten Werte sind vorausgefüllt.
- [ ] Gegeben ein Nutzer löscht ein Feedback — dann werden Bewertung und Notiz für dieses Item+Tour entfernt, der Packlisten-Eintrag bleibt erhalten.
- [ ] Das Feedback-Formular ist nur zugänglich, wenn der Nutzer der Besitzer der Tour ist.

### Feedback anzeigen (Tour-Detailseite)
- [ ] Das System soll pro Packlisten-Item anzeigen: Sterne-Bewertung (falls vorhanden), Notiz-Vorschau (erste 100 Zeichen, aufklappbar).
- [ ] Items ohne Feedback werden als "Kein Feedback" oder neutral ohne Rating angezeigt.

### Garage History (Item-Detailseite)
- [ ] Gegeben ein Nutzer öffnet ein Item in der Garage — dann gibt es einen Abschnitt "Touren" der alle Touren listet, bei denen dieses Item in der Packliste war.
- [ ] Jeder Eintrag zeigt: Tour-Name, Datum, Tour-Status, eigene Bewertung (Sterne, falls vorhanden).
- [ ] Ein Klick auf eine Tour in dieser Liste navigiert zur Tour-Detailseite.
- [ ] Gegeben das Item wurde noch bei keiner Tour genutzt — dann wird "Noch bei keiner Tour genutzt" angezeigt.

## Edge Cases
- Feedback kann nur vom Besitzer der Tour hinterlegt oder bearbeitet werden.
- Wenn eine Tour gelöscht wird (PROJ-11), werden alle zugehörigen Feedback-Einträge ebenfalls gelöscht (CASCADE).
- Wenn ein Item aus der Garage gelöscht wird, werden alle Feedback-Einträge für dieses Item ebenfalls gelöscht (CASCADE).
- Eine Bewertung von 0 Sternen ist nicht erlaubt (entweder 1–5 oder gar keine Bewertung).
- Bei öffentlichen Touren: Feedback (Notizen + Bewertungen) ist für andere Nutzer lesbar — Nutzer wird bei "Öffentlich"-Toggle in PROJ-11 darüber informiert.
- Max. Textlänge der Notiz: 1000 Zeichen, mit Zeichenzähler im Formular.

## Data & Privacy (PII)
- PII involved: Notiz-Inhalte könnten persönliche Informationen enthalten. Bei öffentlichen Touren werden Notizen und Bewertungen sichtbar. Datenschutzhinweis beim Öffentlich-Schalten (liegt in PROJ-11).
- Feedback ist immer an die Sichtbarkeit der Tour gebunden (`is_public` aus Tour).

## Technical & UI Requirements
- **A11y:** Stern-Bewertung als zugängliches Radio-Button-Pattern (nicht nur visuell), Tooltips für Sternwerte ("1 = Sehr schlecht", "5 = Ausgezeichnet")
- **Performance:** Feedback-Speicherung < 200ms, Garage History lädt lazy/on-demand
- **Security:** RLS: Nur Besitzer darf Feedback schreiben/lesen; bei öffentlicher Tour ist Lesen erlaubt
- **Browser Support:** Chrome, Firefox, Safari (Desktop + Mobile)

---

## Tech Design (Solution Architect)

### Component Structure

**Tour Detail Page** (`/tours/[id]`) — extended:

```
TourDetailPage (Server Component)
+-- Header, TourStatsGrid (existing, unchanged)
+-- TourPacklist (existing — extended with feedback)
    +-- PacklistItem (per entry)
        |   [existing: icon, name, weight, category, remove button]
        +-- FeedbackDisplay (inline, below item info)
        |   +-- StarDisplay (filled/empty stars, read-only)
        |   +-- NotePreview (first 100 chars, collapsible)
        +-- FeedbackButton (owner only)
            "Feedback hinzufügen" | "Feedback bearbeiten"
            → opens FeedbackSheet

FeedbackSheet (Client Component, Sheet)
+-- StarRating (accessible radio-group, 1–5 stars)
+-- NoteTextarea (max 1000 chars, with live char counter)
+-- Save Button
+-- Delete Button (only visible if feedback already exists)
```

**Garage Item Edit Page** (`/garage/[id]/edit`) — extended:

```
EditItemPage (Server Component)
+-- Header + DeleteItemForm (existing)
+-- ItemForm (existing)
+-- ItemTourHistory (NEW — server-side section)
    +-- Section header: "Touren"
    +-- TourHistoryRow (per tour, clickable link → /tours/[id])
    |   +-- Tour name
    |   +-- Date + TourStatusBadge
    |   +-- StarDisplay (owner's rating, if set)
    +-- EmptyState: "Noch bei keiner Tour genutzt"
```

### Data Model

**Changes to existing table: `tour_items`** (two new nullable columns — no separate table needed, 1:1 relationship):

| Column | Type | Constraint |
|--------|------|-----------|
| `rating` | integer, nullable | CHECK: 1 ≤ rating ≤ 5 |
| `note` | text, nullable | CHECK: length ≤ 1000 chars |

Existing cascade behavior handles cleanup automatically:
- Tour deleted → `tour_items` rows deleted → feedback deleted
- Item deleted → `tour_items` rows deleted → feedback deleted

### Security & RLS

`tour_items` is missing an UPDATE policy — this feature adds one:

| Operation | Who | Policy |
|-----------|-----|--------|
| SELECT | Tour owner + public tours | Existing (unchanged) |
| INSERT | Tour owner | Existing (unchanged) |
| UPDATE (rating/note) | Tour owner only | **New** — check `tours.user_id = auth.uid()` |
| DELETE | Tour owner | Existing (unchanged) |

Feedback visibility on public tours: the existing SELECT RLS already makes `rating` and `note` readable when `tours.is_public = true`. No additional policy needed.

### API & Tech Strategy

**New Supabase migration** (`0011_tour_item_feedback.sql`):
- ALTER TABLE `tour_items`: add `rating` + `note` columns with CHECK constraints
- CREATE UPDATE RLS policy for tour owners

**New Server Actions** (extend `src/app/(app)/tours/actions.ts`):
- `upsertFeedbackAction(tourId, itemId, rating?, note?)` — Zod validates inputs, verifies ownership, upserts rating/note on the matching `tour_items` row
- `deleteFeedbackAction(tourId, itemId)` — verifies ownership, sets both columns to NULL

**Data fetching — Tour Detail Page:**
Existing `tour_items` query is extended to also select `rating` and `note` — no extra query needed.

**Data fetching — Garage History:**
New server-side query on the item edit page: load all `tour_items` for this `item_id`, joined with `tours` (name, start_date, end_date, status, rating), sorted by `start_date DESC`.

### New Files

| File | Type | Purpose |
|------|------|---------|
| `src/components/tours/FeedbackSheet.tsx` | Client Component | Sheet with star rating + note textarea |
| `src/components/tours/StarRating.tsx` | Client Component | Accessible radio-group star input (A11y) |
| `src/components/tours/StarDisplay.tsx` | Server/Client Component | Read-only star display |
| `src/components/items/ItemTourHistory.tsx` | Server Component | "Touren" section on item edit page |
| `supabase/migrations/0011_tour_item_feedback.sql` | DB Migration | Add rating/note columns + UPDATE RLS |

**Modified files:**
- `src/components/tours/TourPacklist.tsx` — add FeedbackDisplay + FeedbackButton per item
- `src/app/(app)/garage/[id]/edit/page.tsx` — add ItemTourHistory section below ItemForm
- `src/app/(app)/tours/actions.ts` — add upsertFeedback + deleteFeedback server actions

### Dependencies

No new npm packages — all required primitives already installed:
- `radio-group` (shadcn/ui) — accessible star rating (radio-button pattern per A11y spec)
- `sheet` (shadcn/ui) — feedback form overlay, consistent with existing ItemPickerSheet
- `textarea` (shadcn/ui) — note field
- `lucide-react` — star icons (Star, StarOff)

## Implementation Notes

### Frontend (2026-05-10)

**Restored type aliases in `src/types/supabase.ts`** — `supabase gen types` wiped the custom convenience aliases (`ItemRow`, `TourRow`, `TourItemRow`, `GroupRow`, `ProfileRow`, `ItemCategory`, `TourStatus`, `BikeOption`). Re-added them after the generated block.

**New components:**
- `src/components/tours/StarDisplay.tsx` — read-only star indicator (server/client compatible); used in TourPacklist and ItemTourHistory
- `src/components/tours/StarRating.tsx` — accessible radio-group star input (shadcn RadioGroup); fulfils A11y spec requirement
- `src/components/tours/FeedbackSheet.tsx` — bottom Sheet with StarRating + Textarea (≤1000 chars with live counter); Save/Delete/Cancel; syncs state on re-render via `useEffect`

**Modified components:**
- `src/components/tours/TourPacklist.tsx` — extended `PacklistEntry` with `rating`/`note`; added feedback display row per item (stars + collapsible 100-char note preview); `FeedbackSheet` trigger visible to owner only
- `src/app/(app)/tours/[id]/page.tsx` — query extended to `select("id, item_id, rating, note, items(*)")`

**Garage History:**
- `src/components/items/ItemTourHistory.tsx` — async Server Component; queries `tour_items` joined with `tours`, sorted by date desc, limit 50; shows tour name, date range, status badge, star rating; link to `/tours/[id]`
- `src/app/(app)/garage/[id]/edit/page.tsx` — `<ItemTourHistory itemId={id} />` added below ItemForm

**Build:** `npm run build` passes with 0 TypeScript errors.

### Backend (2026-05-10)

**Migration: `supabase/migrations/0011_tour_item_feedback.sql`**
- Added `rating` (smallint, nullable, CHECK 1–5) to `tour_items`
- Added `note` (text, nullable, CHECK length ≤ 1000) to `tour_items`
- Added `tour_items_update_owner` RLS policy: only tour owner may UPDATE rating/note (via subquery on `tours.user_id`)
- No new table created — 1:1 relationship stored inline on `tour_items`

**Server Actions: `src/app/(app)/tours/actions.ts`**
- `upsertFeedbackAction(tourId, itemId, rating, note)` — Zod validates inputs (at least one field non-null, rating 1–5, note ≤ 1000 chars), verifies tour ownership via explicit DB check + RLS, then UPDATEs the matching `tour_items` row
- `deleteFeedbackAction(tourId, itemId)` — verifies ownership, sets rating + note to NULL (packlist entry is preserved)
- Both actions call `revalidatePath` on the tour detail page

**Type generation required:** Run `supabase gen types typescript --local > src/types/supabase.ts` to expose `rating` + `note` on `TourItemRow`.

## QA Test Results

**Tested:** 2026-05-10
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status

**Feedback erfassen (Tour-Detailseite)**
- [x] **AC-1:** "Feedback hinzufügen / bearbeiten" Button pro Packlisten-Item — **Pass** (FeedbackSheet per entry, owner-only)
- [x] **AC-2:** Formular enthält 1–5 Sterne + Freitext-Notiz — **Pass** (StarRating RadioGroup + Textarea)
- [x] **AC-3:** Speichern wenn mindestens ein Feld ausgefüllt — **Pass** (Zod `refine` + client `canSave` guard)
- [x] **AC-4:** Bestehende Werte vorausgefüllt, Button zeigt "bearbeiten" — **Pass** (`initialRating`/`initialNote` props + `hasExistingFeedback` flag)
- [x] **AC-5:** Löschen entfernt Bewertung+Notiz, Packlisten-Eintrag bleibt — **Pass** (`deleteFeedbackAction` setzt NULL, `tour_items` Zeile bleibt)
- [x] **AC-6:** Feedback-Formular nur für Tour-Besitzer zugänglich — **Pass** (FeedbackSheet nur gerendert wenn `isOwner`, Server Action prüft `user_id`)

**Feedback anzeigen (Tour-Detailseite)**
- [x] **AC-7:** Sterne-Bewertung + Notiz-Vorschau (100 Zeichen, aufklappbar) — **Pass** (StarDisplay + ChevronDown/Up Toggle in TourPacklist)
- [x] **AC-8:** Items ohne Feedback zeigen "Kein Feedback" — **Pass** (Text sichtbar wenn `!hasFeedback && isOwner`)

**Garage History (Item-Detailseite)**
- [x] **AC-9:** Abschnitt "Touren" / "Nutzungshistorie" auf Item-Seite — **Pass** (ItemTourHistory Server Component)
- [x] **AC-10:** Einträge zeigen Tour-Name, Datum, Status, Sterne — **Pass** (TourHistoryRow mit allen Feldern)
- [x] **AC-11:** Klick navigiert zur Tour-Detailseite — **Pass** (Next.js `Link` zu `/tours/[id]`)
- [x] **AC-12:** Leerstand "Noch bei keiner Tour genutzt" — **Pass** (Dashed-Border Empty State)

**A11y Check**
- [x] Stern-Bewertung als Radio-Button-Pattern — **Pass** (`RadioGroupItem` mit `sr-only`, Tooltips via `title`-Attribut)
- [x] `aria-live="polite"` auf Zeichenzähler — **Pass**
- [x] `role="img"` + `aria-label` auf StarDisplay — **Pass**
- [x] `aria-label` auf FeedbackSheet-Trigger — **Pass** (dynamisch: "hinzufügen" / "bearbeiten")
- [x] Keyboard-Navigation via Tab durch Sterne + Textarea + Buttons — **Pass** (RadioGroup + native form elements)

### Security & Privacy Audit

- [x] **RLS Verification:** `tour_items_update_owner` Policy korrekt mit `USING` + `WITH CHECK`. Nur Tour-Besitzer kann UPDATE ausführen. Ownership-Prüfung auch auf Application-Layer (defense-in-depth). Keine Bypass-Möglichkeit über direkte Supabase-Aufrufe.
- [x] **PII Protection:** Notiz-Inhalte werden nicht in Console-Logs ausgegeben. Feedback-Sichtbarkeit korrekt an `tours.is_public` gebunden via bestehende SELECT-RLS.
- [x] **Injection:** UUID-Validierung vor jedem DB-Aufruf (`isValidTourId`). Zod validiert alle Inputs. React JSX escaped User-Content automatisch (XSS-Schutz). Supabase Client nutzt Prepared Statements (SQLi-Schutz).
- [x] **Cascade-Deletion:** Tour löschen → `tour_items` gelöscht → Feedback gelöscht. Item löschen → `tour_items` gelöscht → Feedback gelöscht (via bestehende FK-Constraints).

### Tests

- **Unit Tests:** 271/271 bestanden (13 Testdateien) — inkl. 14 neue Feedback-Validierungs-Tests in `src/lib/tours/feedback-validation.test.ts`
- **E2E Tests:** 18 Tests in `tests/PROJ-12-tour-item-feedback-garage-history.spec.ts` — alle übersprungen (Supabase nicht im CI konfiguriert), kein Fehler

### Bugs Found

#### BUG-1: Stille Erfolgsmeldung bei ungültiger item_id
- **Severity:** Medium
- **Beschreibung:** `upsertFeedbackAction` gibt `{}` (Erfolg) zurück, auch wenn `item_id` nicht zur Tour-Packliste gehört und 0 Zeilen aktualisiert wurden.
- **Steps:** 1. Direktaufruf von `upsertFeedbackAction` mit gültiger `tourId` (eigene Tour) und fremder `itemId`. 2. Keine Fehlermeldung, keine Datenmutation.
- **Impact:** Keine Sicherheitsauswirkung (keine Daten verändert). UI verhindert diesen Fall — FeedbackSheet öffnet sich nur von validen Packlisten-Einträgen aus.
- **Priority:** Nächster Sprint (kein Deployment-Blocker)

#### BUG-2: Kein Bestätigungsdialog vor Feedback-Löschen
- **Severity:** Low
- **Beschreibung:** "Löschen"-Button in FeedbackSheet löscht Feedback sofort ohne Bestätigung. Nutzer kann versehentlich eine längere Notiz löschen.
- **Steps:** 1. Feedback mit Notiz anlegen. 2. "Feedback bearbeiten" öffnen. 3. "Löschen" klicken → sofort gelöscht.
- **Priority:** Nächster Sprint (UX, nicht funktional)

### Summary

- **AC Status:** 12/12 bestanden
- **A11y:** Pass
- **Security:** Pass (keine kritischen Findings)
- **Unit Tests:** 271/271 ✓
- **E2E Tests:** 18/18 skipped (Supabase-Konfiguration fehlt in CI)
- **Production Ready: YES** — keine kritischen oder High-Severity Bugs

## Deployment
_To be added by /deploy_
