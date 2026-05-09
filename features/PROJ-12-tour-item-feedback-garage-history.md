# PROJ-12: Tour Item Feedback & Garage History

## Status: Planned
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
_To be added by /architecture_

## Implementation Notes
_To be added by /frontend and /backend_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
