# PROJ-13: Item View/Edit Split

## Status: Planned
**Created:** 2026-05-12
**Last Updated:** 2026-05-12

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
_To be added by /architecture_

## Implementation Notes
<!-- REQUIRED BY GENERAL RULES: Document what was built and any deviations from this spec -->
-

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
