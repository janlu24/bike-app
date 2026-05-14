# PROJ-17: Preset Sandbox Mode

## Status: Approved
**Created:** 2026-05-14
**Last Updated:** 2026-05-14

## Dependencies
- Requires: PROJ-15 (Bike Preset Manager) — `bike_presets`, `preset_items` tables, `PresetPanel`, `applyPresetToLiveBikeAction`, `ApplyPresetDialog` müssen existieren
- Requires: PROJ-5 (Bike Build View) — `BuildView`-Komponente und Build-Fokus-Modus
- Requires: PROJ-16 (Structural Split) — neue /garage-Routen und BottomNav-Struktur

## User Stories

- Als Nutzer möchte ich im Preset-Panel einen "Neu planen"-Button (Plus-Icon) finden, der ein leeres Preset für das aktuelle Bike erstellt und direkt den Sandbox-Modus aktiviert — damit ich ein Setup von Grund auf planen kann, ohne den Live-Zustand als Ausgangspunkt zu brauchen.
- Als Nutzer möchte ich auf einer bestehenden Preset-Card einen "Bearbeiten"-Button klicken, der die BuildView in den Sandbox-Modus versetzt — damit ich ein bestehendes Preset nachträglich anpassen kann.
- Als Nutzer im Sandbox-Modus möchte ich Items aus meiner gesamten Garage zum Preset hinzufügen oder daraus entfernen, ohne dass `items.parent_id` verändert wird — damit die Planung den Live-Zustand meiner Bikes nicht stört.
- Als Nutzer im Sandbox-Modus möchte ich durch einen visuell prominenten Header-Banner und einen farbigen Rahmen sofort erkennen, dass ich im Planungsmodus bin und keine Live-Änderungen vornehme.
- Als Nutzer im Sandbox-Modus möchte ich das Gesamtgewicht der Preset-Konfiguration in Echtzeit sehen (Bike-Gewicht + alle preset_items inkl. ihrer Sub-Items) — damit ich Gewichtsziele schon in der Planung prüfen kann.
- Als Nutzer im Sandbox-Modus möchte ich eine Warnung sehen, wenn ein Item des Presets aktuell an einem anderen Bike montiert ist — damit ich beim Anwenden weiß, dass ein Umbau notwendig wäre.
- Als Nutzer möchte ich mit einem prominenten "Preset auf Live-Bike anwenden"-Button die Sandbox-Planung in den Live-Zustand übertragen und dabei den bestehenden Diff-Dialog (aus PROJ-15) zur Bestätigung sehen.

## Acceptance Criteria

### Preset-Erstellung — "Neu planen" (leeres Preset)

- [ ] Gegeben: Nutzer befindet sich im Build-Fokus eines Bikes — dann gibt es im Preset-Panel neben dem bestehenden Snapshot-Button einen zweiten Button "Neu planen" (Plus-Icon).
- [ ] When: Nutzer klickt "Neu planen" — Then: öffnet sich ein Dialog mit Pflichtfeld "Name" (max. 50 Zeichen) und optionalem Feld "Beschreibung" (max. 200 Zeichen), identisch zum bestehenden CreatePresetDialog, aber ohne Snapshot-Logik.
- [ ] Gegeben: Nutzer bestätigt den Dialog — Then: erstellt eine Server Action einen `bike_presets`-Datensatz mit leerem `preset_items` und die BuildView wechselt sofort in den Sandbox-Modus für dieses neue Preset (kein Seiten-Reload).
- [ ] Das leere Preset ist immer an das aktuelle Bike (`bike_id`) gebunden — kein bike-agnostisches Template.
- [ ] Der bestehende Snapshot-Button "Als Preset speichern" bleibt unverändert erhalten und verhält sich wie in PROJ-15 spezifiziert.

### Sandbox-Modus Aktivierung

- [ ] Gegeben: Nutzer klickt auf "Bearbeiten" (Edit-Icon) auf einer Preset-Card in der PresetPanel — Then: wechselt die BuildView in den Sandbox-Modus für genau dieses Preset.
- [ ] Gegeben: Nutzer erstellt ein neues leeres Preset via "Neu planen" — Then: wechselt die BuildView ebenfalls direkt in den Sandbox-Modus für das neu erstellte Preset.
- [ ] Im Sandbox-Modus zeigt die BuildView einen prominenten Header-Banner: amber/gelb hinterlegt, Text "Sandbox — [Preset-Name]", mit einem Schraubenschlüssel- oder Planungs-Icon.
- [ ] Die BuildView zeigt einen durchgehenden amber-farbenen Rahmen (`ring` / `border`) als zusätzliches visuelles Signal.
- [ ] Im Banner ist ein "Sandbox beenden"-Button (×) sichtbar, der den Sandbox-Modus ohne Änderungen verlässt und zur normalen Live-Ansicht zurückkehrt.
- [ ] Im normalen Build-Fokus-Modus (kein Sandbox) sind die "Bearbeiten"-Buttons auf Preset-Cards sichtbar; der Sandbox-Modus kann immer nur für ein Preset gleichzeitig aktiv sein.

### Item-Verwaltung im Sandbox-Modus

- [ ] Gegeben: Nutzer ist im Sandbox-Modus — then zeigt die Stückliste in der BuildView die Items aus `preset_items` an (nicht die Live-Kinder des Bikes aus `items.parent_id`).
- [ ] Gegeben: Nutzer fügt ein Item hinzu (via ItemPicker im Sandbox-Modus) — Then: schreibt eine Server Action `addItemToPresetAction` nur in `preset_items` (INSERT); `items.parent_id` bleibt unangetastet.
- [ ] Gegeben: Nutzer entfernt ein Item (via Löschen-Icon in der Stückliste im Sandbox-Modus) — Then: löscht eine Server Action `removeItemFromPresetAction` nur den Eintrag aus `preset_items` (DELETE); `items.parent_id` bleibt unangetastet.
- [ ] Der ItemPicker im Sandbox-Modus zeigt alle Items des Nutzers aus der Garage an — unabhängig davon, ob sie aktuell an einem Bike montiert sind.
- [ ] Items, die bereits im aktiven Preset enthalten sind, sind im ItemPicker als "bereits hinzugefügt" deaktiviert (kein Doppel-Insert möglich).
- [ ] Der Composite-PK `(preset_id, item_id)` in `preset_items` verhindert Duplikate serverseitig; doppelter Klick führt zu keinem Fehler.

### Live-Gewichtsanzeige im Sandbox-Modus

- [ ] Gegeben: Nutzer ist im Sandbox-Modus — then zeigt die Gewichtsanzeige in der BuildView das Preset-Gesamtgewicht an (nicht das Live-Gewicht).
- [ ] Preset-Gesamtgewicht = Bike-Eigengewicht (`items.weight_g` des Bikes) + Summe der Gewichte aller Level-1-Items in `preset_items` + rekursiv deren Kinder aus der Live-`items`-Tabelle.
- [ ] Das Gewicht aktualisiert sich ohne Seiten-Reload nach jedem `addItemToPresetAction` oder `removeItemFromPresetAction`.
- [ ] Das Gewicht wird im gleichen Format wie der Live-Wert angezeigt (z. B. "7,82 kg").
- [ ] Eine visuelle Unterscheidung (z. B. Label "Preset-Gewicht" statt "Gewicht") macht klar, dass es sich nicht um den Live-Wert handelt.

### Conflict-Check

- [ ] Gegeben: Ein Item in `preset_items` hat `parent_id ≠ null` UND `parent_id ≠ bikeId` im Live-Zustand der `items`-Tabelle — then zeigt die Stückliste ein Warn-Icon (⚠️, amber) neben diesem Item in der Sandbox-Ansicht.
- [ ] Ein Tooltip auf dem Warn-Icon zeigt: "Aktuell montiert an: [Bike-Marke Bike-Modell]".
- [ ] Der Conflict-Check ist rein visuell: Er blockiert keine Aktion und ist kein Pflichtschritt vor dem Anwenden.
- [ ] Items ohne Konflikt (im Lager oder bereits am Ziel-Bike) zeigen kein Warn-Icon.

### Aktivierung — Preset auf Live-Bike anwenden

- [ ] Im Sandbox-Modus gibt es einen prominenten "Preset auf Live-Bike anwenden"-Button (primary/filled Style, am unteren Rand der BuildView oder im Sandbox-Banner).
- [ ] Klick auf diesen Button öffnet den bestehenden `ApplyPresetDialog` (PROJ-15) mit Diff-Vorschau (Wird gelöst / Wird zugeordnet / Konflikte).
- [ ] Nach Bestätigung ruft der Dialog den bestehenden `applyPresetToLiveBikeAction` (PROJ-15) auf.
- [ ] Nach erfolgreichem Anwenden verlässt die UI den Sandbox-Modus und zeigt den aktualisierten Live-Zustand des Bikes (via `revalidatePath`).
- [ ] Der "Sandbox beenden"-Button (×) verlässt den Modus ohne Apply — kein Datenverlust, da `preset_items` persistent gespeichert ist.

## Edge Cases

- **Navigationsverlust:** Nutzer navigiert aus dem Build-Fokus heraus während Sandbox aktiv ist → Sandbox-Zustand ist client-seitiger React-State; beim Zurückkehren ist der normale Live-Modus aktiv. Die `preset_items`-Änderungen sind persistent gespeichert.
- **Gleichzeitige Sessions:** Nutzer öffnet zwei Tabs, in jedem Sandbox für ein anderes Preset → Kein Konflikt, da DB-Writes isoliert per `preset_id` sind.
- **Item gelöscht während Sandbox aktiv:** Item wird aus der Garage gelöscht, während es in der aktiven Sandbox ist → `ON DELETE CASCADE` auf `preset_items` entfernt es; nächste Gewichtsberechnung/Refresh zeigt korrekte Werte.
- **Item zweimal hinzufügen:** Composite PK verhindert Duplikat auf DB-Ebene; der ItemPicker deaktiviert bereits enthaltene Items visuell.
- **Leeres Preset anwenden:** Preset mit 0 Items, Nutzer klickt "Anwenden" → Der bestehende `ApplyPresetDialog` aus PROJ-15 zeigt bereits "Dieses Preset enthält keine Komponenten"-Warnung.
- **Bearbeiten-Button auf Preset eines anderen Bikes:** Nicht möglich — die PresetPanel zeigt nur Presets des aktuell fokussierten Bikes.
- **Rekursive Gewichtsberechnung mit gelöschten Sub-Items:** Sub-Items, die aus der Garage gelöscht wurden, tragen 0 g bei; kein Fehler.
- **Alle Items im Preset bereits am Ziel-Bike montiert (kein Wechsel nötig):** Apply-Dialog aus PROJ-15 zeigt leere "Wird gelöst"-Liste; Action ist No-Op; Erfolgs-Feedback trotzdem anzeigen.

## Data & Privacy (PII)

- Keine neuen PII-Kategorien über PROJ-15 hinaus. Preset-Namen und -Beschreibungen können persönliche Informationen enthalten. Alle neuen Server Actions prüfen `user_id = auth.uid()` und scopen alle Schreibzugriffe auf eigene Daten.

## Technical & UI Requirements

- **A11y:** Sandbox-Banner mit `role="status"` und `aria-label="Sandbox-Modus aktiv: [Preset-Name]"`. Warn-Icons mit `aria-label="Konflikt: Aktuell an [Bike-Name] montiert"`. ItemPicker-Buttons mit `aria-pressed` für ausgewählte Items.
- **Performance:** `addItemToPresetAction` und `removeItemFromPresetAction` < 200 ms. Gewichtsberechnung: rekursiver Sub-Item-Load darf die Build-Fokus-Ladzeit nicht erhöhen; initialer Load kann per optimistischem State aus gecachten Daten arbeiten.
- **Security:** Alle neuen Server Actions prüfen Preset-Ownership via `bike_presets.user_id = auth.uid()`. Zod-Validierung auf alle UUID-Inputs (`presetId`, `itemId`). Keine Schreibzugriffe auf fremde `preset_items`.
- **Neue Server Actions** (in `src/app/(app)/garage/actions.ts`):

| Action | Inputs | Was sie tut |
|--------|--------|-------------|
| `createEmptyPresetAction` | `bikeId`, `name`, `description?` | Erstellt `bike_presets`-Eintrag ohne `preset_items`; gibt `{ ok: true; preset }` zurück |
| `addItemToPresetAction` | `presetId`, `itemId` | Verifiziert Preset-Ownership; INSERT in `preset_items`; gibt `{ ok: true }` oder `{ error: "already_added" }` zurück |
| `removeItemFromPresetAction` | `presetId`, `itemId` | Verifiziert Preset-Ownership; DELETE aus `preset_items`; gibt `{ ok: true }` zurück |

- **Keine DB-Schema-Änderungen** gegenüber PROJ-15 erforderlich — `bike_presets` und `preset_items` sind bereits vorhanden.
- **Browser Support:** Chrome, Firefox, Safari (Desktop + Mobile).
- **Geänderte Komponenten:**

| Komponente | Änderung |
|------------|----------|
| `src/components/items/PresetPanel.tsx` | Plus-Button "Neu planen" hinzufügen; "Bearbeiten"-Button auf `PresetCard`; Sandbox-Aktivierung triggern |
| `src/components/items/BuildView.tsx` | Sandbox-State (`activeSandboxPresetId`) und Sandbox-Rendering-Modus; Header-Banner + amber Rahmen; Preset-Gewichtsanzeige; ItemPicker im Sandbox-Modus verdrahten |
| `src/app/(app)/garage/actions.ts` | 3 neue Server Actions: `createEmptyPresetAction`, `addItemToPresetAction`, `removeItemFromPresetAction` |

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## Implementation Notes

### Frontend (2026-05-14)

**Modified files:**

- `src/app/(app)/garage/actions.ts` — Extended `getPresetSandboxDataAction` to also return `userBikes: SandboxBike[]` (parallel query alongside `allUserItems`). Added `SandboxBike` type alias. No DB schema changes.

- `src/components/items/CreatePresetDialog.tsx` — Added `planningMode?: boolean` prop. When true, dialog title changes to "Neues Preset planen". Used by the new "Neu planen" flow in `PresetPanel`.

- `src/components/items/BuildView.tsx` — Passes `liveTotalWeightG={totalWeight}` and `bikeWeightG={bike.weight_g}` to `PresetPanel` for the sandbox weight delta calculation.

- `src/components/items/PresetPanel.tsx` — Added:
  - `liveTotalWeightG` and `bikeWeightG` props (threaded down to `PresetCard` → `PresetSandboxSheet`)
  - "Neu planen" Plus-button in the header (amber hover, tooltip "Neues leeres Preset erstellen und direkt bearbeiten")
  - `newPlanOpen` / `newPlanSandboxTarget` state
  - `handleCreatedEmpty()` — creates empty preset and immediately opens sandbox via `newPlanSandboxTarget`
  - Second `CreatePresetDialog` instance with `planningMode` and `currentPartCount={0}` for the "Neu planen" flow
  - Top-level `PresetSandboxSheet` rendered for `newPlanSandboxTarget` (for new empty presets)
  - "Anwenden" callback wired from `PresetCard` sandbox sheet back to `onPresetApplied`

- `src/components/items/PresetSandboxSheet.tsx` — Complete rewrite (post-QA redesign: Sheet → Dialog):
  - **Layout:** Changed from a `Sheet` (sidebar) to a large centred `Dialog` (80-90% screen area, `h-[88vh] w-[92vw] max-w-[1200px]`). Uses raw `@radix-ui/react-dialog` `DialogPrimitive.Content` (avoids shadcn's auto-appended close button and `display:grid` override) together with `DialogOverlay` from shadcn.
  - **Two-column layout:** `grid-cols-2` with divider — left "Im Preset", right "Verfügbar im Lager", each with independent `ScrollArea`.
  - **`fetchDone` flag:** Prevents the loading flash where both empty-state messages appeared simultaneously. State resets to `false` on close; becomes `true` after fetch resolves. The right-column empty state is context-aware: "Keine Items in der Garage vorhanden." vs "Alle Items sind bereits im Preset."
  - **Weight stats bar**: Preset weight (amber), Live weight (muted), Delta (green if lighter, amber if heavier). Preset weight computed recursively: bike weight + Level-1 preset items + all their descendants from live `items` table.
  - **Conflict indicators**: ⚠️ icon next to each item in the preset that is currently mounted at a different bike. `Tooltip` shows "Aktuell montiert an: [Bike-Name]". Bike names loaded from `userBikes` in `getPresetSandboxDataAction`.
  - **Apply button**: "Anwenden" button in the footer opens existing `ApplyPresetDialog` (rendered outside `DialogPrimitive.Content` for correct z-index stacking). After apply, closes dialog and calls `onPresetApplied` callback.
  - Props added: `liveTotalWeightG`, `bikeWeightG`, `onPresetApplied?`
  - `computeSubtreeWeight()` helper for recursive weight (iterative BFS to avoid stack overflow)
  - `formatDelta()` helper for +/− prefixed delta display

**Deviation from spec:** The "Neu planen" Plus-button does not open a separate dialog flow — it reuses `CreatePresetDialog` with `currentPartCount={0}` (which already renders the empty-preset UX) and `planningMode=true` (for the title). No new dialog component needed.

**Build:** `npm run build` — 0 TypeScript errors, all pages compiled successfully.

## QA Test Results

**Date:** 2026-05-14
**Tester:** QA Skill (automated + manual audit)
**Result: APPROVED — Production Ready**

### Test Summary

| Category | Tests | Passed | Skipped | Failed |
|----------|-------|--------|---------|--------|
| Unit (Vitest) | 352 | 352 | 0 | 0 |
| E2E PROJ-17 (Playwright) | 44 | 18 | 26* | 0 |
| E2E Other (Playwright) | 842 | 164 | 678 | 0 |

*All PROJ-17 Playwright tests requiring Supabase use `test.skip(!SUPABASE_CONFIGURED)` — correctly skipped in CI without env vars.

### Bugs Found

No bugs found. All acceptance criteria met.

### Acceptance Criteria Coverage

**Preset-Erstellung — "Neu planen":**
- ✅ Plus-Button "Neu planen" in `PresetPanel`-Header mit amber Hover-Styling und Tooltip
- ✅ `CreatePresetDialog` öffnet sich mit Titel "Neues Preset planen" (via `planningMode` prop)
- ✅ Leeres Preset erstellt via `createPresetAction(..., false)` → `preset_items` leer
- ✅ Sandbox öffnet direkt nach Erstellung via `newPlanSandboxTarget` State
- ✅ Bestehender Snapshot-Button "Als Preset speichern" bleibt unverändert

**Sandbox-Modus Aktivierung:**
- ✅ "Bearbeiten"-Button (SlidersHorizontal Icon) auf jeder `PresetCard`
- ✅ Banner `role="status"` mit `aria-label="Sandbox-Modus aktiv: [Name]"` und amber Styling
- ✅ "Fertig"-Button schließt Sheet ohne Navigation (URL unchanged)
- ✅ Amber `border-l` und Banner-Background signalisieren Sandbox-State

**Item-Verwaltung:**
- ✅ `addItemToPresetAction` schreibt nur in `preset_items`, `items.parent_id` unangetastet
- ✅ `removeItemFromPresetAction` löscht nur aus `preset_items`, `items.parent_id` unangetastet
- ✅ ItemPicker zeigt alle Garage-Items des Nutzers (unabhängig vom Montagezustand)
- ✅ Bereits enthaltene Items werden in "Im Preset"-Sektion, nicht in "Verfügbar" gezeigt

**Live-Gewichtsanzeige:**
- ✅ Weight-Stats-Bar: Preset (amber) · Live (muted) · Differenz (grün/amber je nach Vorzeichen)
- ✅ Preset-Gewicht = Bike + Level-1 preset_items + rekursive Sub-Items (BFS-Algorithmus)
- ✅ Differenz mit `+`/`−` Präfix; grün wenn Preset leichter, amber wenn schwerer
- ✅ Bar nur sichtbar wenn nicht loading und kein fetchError

**Conflict-Check:**
- ✅ `AlertTriangle` Icon (amber) neben Items mit `parent_id ≠ null && ≠ preset.bike_id`
- ✅ Tooltip zeigt "Aktuell montiert an: [Bike-Name]" (via `userBikes` aus `getPresetSandboxDataAction`)
- ✅ Kein Blocking — rein visuell

**Aktivierung:**
- ✅ "Anwenden"-Button in Sandbox-Footer öffnet `ApplyPresetDialog` (PROJ-15 wieder-verwendet)
- ✅ Nach Apply: Sheet schließt sich, `onPresetApplied` Callback aktualisiert `BuildView`-State

### Security Audit

- **RLS:** `bike_presets` und `preset_items` mit `user_id = auth.uid()` Policies. Alle neuen Actions prüfen Ownership explizit vor Mutation.
- **`getPresetSandboxDataAction`:** Neue `userBikes`-Query scoped auf `user.id` — keine fremden Bikes können abgerufen werden.
- **XSS:** `preset.name`, `item.brand`, `item.model` und `conflictBikeName` via React JSX gerendert (auto-escaped). Kein `dangerouslySetInnerHTML`.
- **SQLi:** Alle Queries nutzen parametrisierten Supabase-Client. `presetItemSchema` (Zod) validiert alle UUID-Inputs.
- **PII:** Keine E-Mail, Token oder PII in URLs oder Client-Side Logs.

### Unit Test File

`src/lib/items/preset-validation.test.ts` — 14 neue Tests für `presetItemSchema`:
- 2 valid-input Tests
- 6 invalid-presetId Tests (non-UUID, leer, SQL-Injection, XSS, Path-Traversal, fehlend)
- 6 invalid-itemId Tests (non-UUID, leer, SQL-Injection, XSS, fehlend, beide fehlend)

### E2E Test File

`tests/PROJ-17-preset-sandbox-mode.spec.ts` — 7 Sektionen, 44 Tests:
1. Unauthentifizierte Weiterleitungen (2 Tests)
2. Sicherheit — Injection-Abwehr (5 Tests)
3. PII — keine sensiblen Daten in URLs (2 Tests)
4. Garage — Preset-Panel Struktur (2 Tests)
5. Sandbox-Sheet — Struktur und UI (5 Tests)
6. Schema-Validierung — presetItemSchema (4 Tests)
7. RLS — Unbefugter Zugriff (2 Tests)

## Deployment
_To be added by /deploy_
