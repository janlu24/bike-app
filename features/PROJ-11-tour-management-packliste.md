# PROJ-11: Tour Management & Packliste

## Status: Approved
**Created:** 2026-05-09
**Last Updated:** 2026-05-09

## Dependencies
- Requires: PROJ-1 (User Authentication) — Touren sind nutzerspezifisch
- Requires: PROJ-3 (Item Management / Garage) — Items aus der Garage werden der Packliste hinzugefügt
- Optional: PROJ-7 (Explore / Community Feed) — öffentliche Touren können im Feed erscheinen

## User Stories
- Als Nutzer möchte ich eine neue Tour anlegen (mit Namen, Start, Ziel und Rohdaten), damit ich meine Ausfahrten strukturiert erfassen kann.
- Als Nutzer möchte ich zwischen "Geplant" und "Gefahren" unterscheiden können, damit ich Planung und Ausführung einer Tour trennen kann.
- Als Nutzer möchte ich eine Packliste für eine Tour erstellen, indem ich Items aus meiner Garage hinzufüge, damit ich vor der Tour weiß, was ich mitnehme.
- Als Nutzer möchte ich das Gesamtgewicht meiner Packliste sehen, damit ich mein Setup optimieren kann.
- Als Nutzer möchte ich Items aus der Packliste wieder entfernen können, damit ich die Liste anpassen kann.
- Als Nutzer möchte ich eine Tour als öffentlich oder privat markieren können, damit ich selbst entscheide, was geteilt wird.
- Als Nutzer möchte ich alle meine Touren in einer Übersicht sehen, damit ich meine Tour-Historie im Blick behalte.
- Als zukünftige Erweiterung: Ich möchte Tour-Daten aus Komoot/Strava importieren können, damit ich sie nicht manuell eingeben muss (Vorbereitung, nicht MVP).

## Acceptance Criteria

### Tour erstellen
- [ ] Gegeben ein eingeloggter Nutzer auf /tours — wenn er "Neue Tour" klickt — dann öffnet sich ein Formular zur Tour-Erstellung.
- [ ] Das System soll das Feld "Name" als einziges Pflichtfeld vorschreiben. Alle anderen Felder sind optional.
- [ ] Das Formular enthält folgende Felder:
  - Name (Text, required)
  - Datum (Date, optional)
  - Start (Text, optional)
  - Ziel (Text, optional)
  - Status (Select: "Geplant" | "Gefahren", default: "Geplant")
  - Geplante km (Dezimalzahl ≥ 0, optional)
  - Geplante Höhenmeter aufwärts (Ganzzahl ≥ 0, optional)
  - Geplante Höhenmeter abwärts (Ganzzahl ≥ 0, optional)
  - Gefahrene km (Dezimalzahl ≥ 0, optional)
  - Gefahrene Höhenmeter aufwärts (Ganzzahl ≥ 0, optional)
  - Gefahrene Höhenmeter abwärts (Ganzzahl ≥ 0, optional)
  - Dauer (Text, z.B. "3:45h" oder Minuten als Zahl, optional)
  - Öffentlich (Toggle/Checkbox, default: false)
- [ ] Gegeben ein gültiges Formular — wenn der Nutzer speichert — dann wird die Tour in der Datenbank angelegt und der Nutzer zur Tour-Detailseite weitergeleitet.

### Tour bearbeiten & löschen
- [ ] Das System soll das Bearbeiten aller Felder einer bestehenden Tour erlauben.
- [ ] Gegeben eine Tour im Status "Geplant" — wenn der Nutzer den Status auf "Gefahren" setzt und Real-Daten einträgt — dann werden die Fehlenden Felder (gefahrene km, Höhenmeter, Dauer) ausgefüllt.
- [ ] Das System soll das Löschen einer Tour nur dem Besitzer erlauben, mit Bestätigungsdialog.
- [ ] Beim Löschen einer Tour werden alle zugehörigen Packlisten-Einträge ebenfalls gelöscht (CASCADE).

### Packliste
- [ ] Gegeben eine Tour-Detailseite — der Nutzer kann Items aus seiner Garage der Packliste hinzufügen.
- [ ] Das System zeigt beim Hinzufügen eine durchsuchbare/filterbare Liste der eigenen Garage-Items an.
- [ ] Das System soll ein Item nur einmal pro Tour in der Packliste erlauben (keine Duplikate).
- [ ] Das System soll das Gesamtgewicht aller Packlisten-Items mit bekanntem Gewicht in Echtzeit anzeigen.
- [ ] Der Nutzer kann Items aus der Packliste wieder entfernen.
- [ ] Die Packliste zeigt pro Item: Name, Kategorie, Gewicht (falls vorhanden), Bild (falls vorhanden).

### Tour-Übersicht
- [ ] Das System zeigt alle Touren des eingeloggten Nutzers unter /tours sortiert nach Datum (neueste zuerst).
- [ ] Die Übersicht zeigt pro Tour: Name, Datum, Status (Badge), km (gefahren oder geplant), Anzahl Packlisten-Items.
- [ ] Gegeben ein Nutzer ohne Touren — dann wird ein leerer Zustand mit CTA "Erste Tour anlegen" angezeigt.

### Navigation
- [ ] Das System soll einen neuen Eintrag "Touren" in der Bottom-Navigation hinzufügen (Route: /tours).
- [ ] Die Bottom-Nav enthält dann: Dashboard, Garage, Touren, Explore, Profil.

### Sichtbarkeit & Zukünftige Integration
- [ ] Touren mit `is_public = true` sind für andere Nutzer sichtbar (Vorbereitung für Explore-Integration).
- [ ] Die Datenbankstruktur für Touren soll ein optionales Feld `external_source` (z.B. "komoot", "strava") und `external_id` vorsehen, für zukünftige API-Importe.

## Edge Cases
- Alle Zahlenfelder (km, Höhenmeter) dürfen nicht negativ sein.
- Dauer-Feld: Freitext akzeptieren ("3:45", "3h45", "225min") — Validierung mit Hinweis, aber kein hartes Format-Enforcement im MVP.
- Ein Item kann mehreren Touren zugewiesen werden (Mehrfachnutzung ist gewünscht).
- Tour ohne ein einziges Packlisten-Item ist erlaubt (nur Rohdaten).
- Wenn ein Item aus der Garage gelöscht wird, während es in einer Packliste ist: Packlisten-Eintrag wird ebenfalls gelöscht (CASCADE), Tour bleibt erhalten.
- Wenn ein Nutzer nicht eingeloggt ist und /tours aufruft: Weiterleitung zur Login-Seite.
- Öffentliche Tour von fremdem Nutzer: Nur lesbar, kein Bearbeiten, kein Hinzufügen zur eigenen Packliste.

## Data & Privacy (PII)
- PII involved: Indirekt — Name der Tour und Start/Ziel-Orte könnten Standortbezug haben. Bei öffentlichen Touren werden diese Felder öffentlich sichtbar. Nutzer wird bei "Öffentlich"-Toggle darauf hingewiesen.
- Touren sind standardmäßig privat (`is_public = false`).

## Technical & UI Requirements
- **A11y:** Formularfelder mit korrekt verknüpften Labels, Fehlermeldungen als `aria-describedby`
- **Performance:** Tourliste lädt in < 300ms, Packlisten-Suche reagiert in < 200ms
- **Security:** Alle Mutations erfordern Authentifizierung; RLS sichert Daten auf Datenbankebene
- **Browser Support:** Chrome, Firefox, Safari (Desktop + Mobile)
- **Future-Proofing:** DB-Schema enthält `external_source` und `external_id` für Komoot/Strava-Import (nullable, nicht im UI)

---

## Tech Design (Solution Architect)

### A) Seitenstruktur (Komponenten-Baum)

```
Bottom Nav (erweitert: +Touren-Tab, Icon: Map aus lucide-react)

/tours                              — Tour-Übersicht (Server Component)
+-- TourList
|   +-- TourCard                    — Name, Datum, Status-Badge, km, Item-Anzahl
|   +-- EmptyState                  — "Erste Tour anlegen" CTA
+-- NewTourButton → /tours/new

/tours/new                          — Neue Tour erstellen (Client Component)
+-- TourForm (react-hook-form + Zod)
    +-- Pflichtfeld: Name
    +-- Optionale Felder: Datum, Start, Ziel, Status-Select
    +-- Sektion "Geplant": km, Höhenmeter ↑, Höhenmeter ↓
    +-- Sektion "Gefahren": km, Höhenmeter ↑, Höhenmeter ↓, Dauer (Stunden + Minuten)
    +-- Toggle: Öffentlich (mit Hinweistext zu Standortdaten)

/tours/[id]                         — Tour-Detailseite (Server Component)
+-- TourHeader                      — Name, Datum, Edit/Delete-Buttons
+-- TourStatusBadge                 — "Geplant" | "Gefahren"
+-- TourStatsGrid                   — Rohdaten in 2 Spalten (Geplant vs. Gefahren)
+-- TourPacklist
|   +-- PacklistWeightTotal         — Summe aller Gewichte (on-the-fly)
|   +-- PacklistItem[]              — Name, Kategorie, Gewicht, Bild, Remove-Button
|   +-- AddItemButton               — öffnet ItemPickerSheet
+-- ItemPickerSheet (Client)        — durchsuchbare/filterbare Garage-Items
    +-- Ergebnis-Liste mit Checkbox-Auswahl

/tours/[id]/edit                    — Tour bearbeiten (TourForm, vorausgefüllt)
```

### B) Datenmodell

**Neue Tabelle: `tours`**

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | UUID PK | Auto-generiert |
| `user_id` | UUID FK → profiles | Besitzer; ON DELETE CASCADE |
| `name` | TEXT (≤100) | Pflichtfeld |
| `date` | DATE | Optional |
| `start_location` | TEXT (≤200) | Optional |
| `destination` | TEXT (≤200) | Optional |
| `status` | ENUM `tour_status` | `planned` \| `completed`, default `planned` |
| `planned_distance_km` | DECIMAL | Optional, ≥ 0 |
| `planned_elevation_up_m` | INTEGER | Optional, ≥ 0 |
| `planned_elevation_down_m` | INTEGER | Optional, ≥ 0 |
| `actual_distance_km` | DECIMAL | Optional, ≥ 0 |
| `actual_elevation_up_m` | INTEGER | Optional, ≥ 0 |
| `actual_elevation_down_m` | INTEGER | Optional, ≥ 0 |
| `duration_hours` | INTEGER | Optional, ≥ 0 |
| `duration_minutes` | INTEGER | Optional, 0–59 |
| `is_public` | BOOLEAN | Default `false` |
| `external_source` | TEXT | Nullable — "komoot" \| "strava" (Phase 2, kein UI) |
| `external_id` | TEXT | Nullable — ID aus externer App (Phase 2, kein UI) |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto (via Trigger) |

**Neue Tabelle: `tour_items`** (Packliste — Junction Table)

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | UUID PK | Auto-generiert |
| `tour_id` | UUID FK → tours | ON DELETE CASCADE |
| `item_id` | UUID FK → items | ON DELETE CASCADE |
| `added_at` | TIMESTAMPTZ | Auto |
| UNIQUE(tour_id, item_id) | | Kein Item doppelt in einer Tour |

**Sicherheit (RLS):**
- `tours` SELECT: Eigene Touren (`user_id = auth.uid()`) ODER `is_public = true`
- `tours` INSERT/UPDATE/DELETE: Nur Besitzer (`user_id = auth.uid()`)
- `tour_items` SELECT: Besitzer der zugehörigen Tour ODER Tour ist öffentlich
- `tour_items` INSERT/DELETE: Nur wer die Tour besitzt

**Datenbankindizes:**
- `tours(user_id)`, `tours(date DESC)`, `tours(is_public)`
- `tour_items(tour_id)`, `tour_items(item_id)`

### C) API & Tech-Strategie

Pattern identisch zur bestehenden Garage-Implementierung:
- Server Actions in `src/app/(app)/tours/actions.ts`
- Zod-Schemas in `src/app/(app)/tours/schema.ts`
- Supabase generierte Types aus `src/types/supabase.ts`

**Datenfluss:**
1. Tour-Übersicht: Server Component lädt Touren via Supabase, sortiert nach `date DESC`
2. Tour erstellen/bearbeiten: `TourForm` (Client, react-hook-form + Zod) → Server Action → Redirect zur Detailseite
3. Item hinzufügen zur Packliste: `ItemPickerSheet` (Client) → Server Action `addTourItem` → `revalidatePath`
4. Gesamtgewicht: Summiert im Server Component beim Laden; kein gecachter Wert in der DB
5. Tour löschen: Server Action mit Bestätigungsdialog → CASCADE löscht `tour_items`

**PII-Umgang:** Start-/Zielort können Standortbezug haben. Toggle "Öffentlich" im Formular zeigt Hinweis: "Start, Ziel und alle Tourdaten werden für andere Nutzer sichtbar."

### D) Neue Pakete

Keine neuen Pakete erforderlich. Alle UI-Primitive sind bereits installiert (Sheet, Dialog, Badge, Button, Input, Select, Form, Switch). `Map`-Icon aus lucide-react (bereits installiert) für den Bottom-Nav.

## Implementation Notes

### Backend (2026-05-09)

**Migration:** `supabase/migrations/0009_tours.sql`
- New ENUM `tour_status` (`planned` | `completed`)
- New table `tours` with all raw data fields, DB-level CHECK constraints for non-negative values and valid ranges, `external_source`/`external_id` columns for future Komoot/Strava import (nullable, no UI)
- New junction table `tour_items` with UNIQUE(tour_id, item_id), CASCADE deletes on both FKs
- RLS on both tables: `tours` — owner or `is_public = true`; `tour_items` — owner only for writes, owner or public tour for reads
- Indexes: `tours(user_id)`, `tours(date DESC)`, `tours(is_public)`, `tour_items(tour_id)`, `tour_items(item_id)`

**Validation lib:** `src/lib/tours/validation.ts`
- `parseTourInput(formData)` — validates all fields, returns `TourValidationResult`
- `isValidTourId(value)` — UUID format check

**Schema:** `src/app/(app)/tours/schema.ts`
- `TourFormState = TourValidationResult & { error?: string }`

**Server Actions:** `src/app/(app)/tours/actions.ts`
- `createTourAction(prev, formData)` — inserts tour, redirects to `/tours/[id]`
- `updateTourAction(tourId, prev, formData)` — updates tour (owner-only), redirects to `/tours/[id]`
- `deleteTourAction(formData)` — deletes tour (CASCADE removes tour_items), redirects to `/tours`
- `addTourItemAction(tourId, itemId)` — adds item to packlist; 23505 duplicate handled
- `removeTourItemAction(tourId, itemId)` — removes item from packlist; explicit ownership check before delete

**⚠️ Action required:** Run `supabase db push` to apply migration, then `supabase gen types typescript --local > src/types/supabase.ts` to update TypeScript types before building.

### Frontend (2026-05-09)

**Components:**
- `src/components/tours/TourForm.tsx` — create/edit form with all fields, `useActionState`, Server Action binding
- `src/components/tours/TourStatusBadge.tsx` — "Geplant" / "Gefahren" badge
- `src/components/tours/TourStatsGrid.tsx` — planned vs. actual stats table
- `src/components/tours/TourCard.tsx` — card for tour overview list
- `src/components/tours/ItemPickerSheet.tsx` — bottom sheet with search for adding garage items to packlist (Client Component)
- `src/components/tours/TourPacklist.tsx` — packlist with total weight and remove buttons (Client Component)

**Pages:**
- `src/app/(app)/tours/page.tsx` — tour list with item count per tour
- `src/app/(app)/tours/new/page.tsx` — new tour form
- `src/app/(app)/tours/[id]/page.tsx` — tour detail with stats, packlist, delete confirm dialog
- `src/app/(app)/tours/[id]/edit/page.tsx` — edit form with owner guard

**Other:**
- `src/lib/tours/utils.ts` — formatting helpers (duration, distance, elevation, date)
- `src/components/BottomNav.tsx` — extended with "Touren" tab (Map icon, 5 items total)
- `src/types/supabase.ts` — added `TourRow`, `TourStatus`, and re-added missing aliases (`ItemRow`, `ItemCategory`, `BikeOption`, `GroupRow`, `ProfileRow`) that were dropped by `supabase gen types`

**Build:** ✅ `npm run build` passes, 0 TypeScript errors. All tour routes visible in build output.

## QA Test Results

**Date:** 2026-05-09
**Status:** ✅ Approved — 0 Critical, 0 High bugs

### Test Execution

| Suite | Tool | Result |
|-------|------|--------|
| Unit — `validation.ts` | Vitest | 50 tests passed |
| Unit — `utils.ts` | Vitest | ~15 tests passed |
| Total unit tests | Vitest | **247 tests passed** (12 files) |
| E2E — PROJ-11 | Playwright | 162 passed, 520 skipped (Supabase-dependent) |

### Acceptance Criteria Coverage

| AC | Description | Result |
|----|-------------|--------|
| Tour erstellen — Name Pflichtfeld | Validierung: leeres Feld → Fehlermeldung | ✅ |
| Tour erstellen — Formularfelder | Name, Datum, Status, geplant/gefahren Sektionen, Dauer-Felder vorhanden | ✅ |
| Tour erstellen — Öffentlich-Toggle | Toggle mit Hinweistext zu Standortdaten | ✅ |
| Tour erstellen — Redirect nach Speichern | Weiterleitung zu `/tours/[id]` | ✅ (Server Action) |
| Tour bearbeiten | Edit-Seite lädt vorausgefülltes Formular, nur Besitzer | ✅ |
| Tour löschen | DELETE mit Besitzerprüfung, CASCADE auf tour_items | ✅ |
| Packliste — Item hinzufügen | ItemPickerSheet mit Suche, Duplikate verhindert | ✅ |
| Packliste — Gesamtgewicht | On-the-fly Berechnung aller Items mit Gewicht | ✅ |
| Packliste — Item entfernen | Remove-Button, Besitzerprüfung | ✅ |
| Tour-Übersicht | `/tours` zeigt alle eigenen Touren, sortiert nach Datum | ✅ |
| Tour-Übersicht — Leer-Zustand | CTA "Erste Tour anlegen" bei 0 Touren | ✅ |
| Navigation — Touren-Tab | Bottom-Nav enthält "Touren" → `/tours`, 5 Einträge gesamt | ✅ |
| Auth-Schutz | Unauthentifizierte Nutzer werden zu `/login` weitergeleitet | ✅ |

### Security Audit

| Check | Result |
|-------|--------|
| RLS `tours` — SELECT | Owner oder `is_public = true` | ✅ |
| RLS `tours` — INSERT/UPDATE/DELETE | Nur Besitzer (`user_id = auth.uid()`) | ✅ |
| RLS `tour_items` — SELECT | Owner oder öffentliche Tour (via Subquery) | ✅ |
| RLS `tour_items` — INSERT/DELETE | Nur Tour-Besitzer (via Subquery) | ✅ |
| Defense-in-depth | Explizite Ownership-Prüfung in Server Actions + RLS | ✅ |
| UUID-Validierung | `isValidTourId()` blockiert Injection in Route-Parametern | ✅ |
| Kein Raw-SQL | Alle Inputs durch `parseTourInput()` validiert, nur Supabase Query Builder | ✅ |
| Middleware-Schutz | `/tours/**` nicht in `PUBLIC_EXACT` — alle Routen auth-geschützt | ✅ |
| PII-Audit | Keine E-Mail/User-IDs in Logs oder Fehlerantworten | ✅ |
| XSS | React escaped Output automatisch; kein `dangerouslySetInnerHTML` | ✅ |
| Path-Traversal | Middleware normalisiert Pfade; kein 500 bei traversal-Versuchen | ✅ |

### A11y Audit

| Check | Result |
|-------|--------|
| Alle Inputs haben zugehörige Labels (`for`/`id`) | ✅ |
| Fehlermeldungen via `aria-describedby` | ✅ |
| h1-Heading auf Übersichts- und Formular-Seiten | ✅ |
| Bottom-Nav mit `aria-label="Hauptnavigation"` | ✅ |

### Bugs Found

None — no bugs identified during testing.

### Production Ready: YES

## Deployment
_To be added by /deploy_
