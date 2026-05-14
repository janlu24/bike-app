# Product Requirements Document

## Vision
The Setup Registry ist ein digitaler Zwilling für sportliche Radsport-Enthusiasten. Die App ermöglicht es, Bikes, Komponenten, Ausrüstung und Bekleidung präzise zu erfassen und – optional – mit der Community zu teilen. Ziel ist ein Präzisionswerkzeug mit Cockpit-Ästhetik: kein Clutter, maximale Datendichte, privat by Default.

## Target Users

**Primäre Zielgruppe:** MTB/Gravel-Fahrer und Rennrad-Fahrer, die mehrere Bikes besitzen und ihre Setups mit Fokus auf Gewicht und Komponentenwahl verwalten wollen.

**Pain Points:**
- Keine zentrale Übersicht über Equipment, Gewichte und Kosten
- Bestehende Tools (Strava, Excel, Notiz-Apps) sind für Inventar-Management ungeeignet
- Kein einfaches Teilen von Setups ohne Screenshot-Chaos
- Komponenten-Zuordnung zu Bikes geht bei Wechsel verloren

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | PROJ-1: Authentication | In Progress |
| P0 (MVP) | PROJ-2: Onboarding & Profil-Setup | In Progress |
| P0 (MVP) | PROJ-3: Item Management / Garage | In Progress |
| P0 (MVP) | PROJ-4: Dashboard / Cockpit | In Progress |
| P0 (MVP) | PROJ-5: Bike Build View | In Progress |
| P1 | PROJ-6: User Profile Page | Planned |
| P1 | PROJ-7: Explore / Community Feed | Planned |
| P1 | PROJ-8: Item Templates & Comparison | Planned |
| P1 | PROJ-9: Guest vs. Member Mode | Planned |
| P1 | PROJ-10: Refactoring & Groups Enhancement | Planned |
| P1 | PROJ-11: Tour Management & Packliste | Planned |
| P1 | PROJ-12: Tour Item Feedback & Garage History | Planned |
| P1 | PROJ-13: Item View/Edit Split | Planned |
| P1 | PROJ-14: Bike Versioning System | Planned |
| P1 | PROJ-15: Bike Preset Manager & Tour Integration | Planned |
| P1 | PROJ-16: Structural Split – Inventory vs. Workshop | Planned |
| P1 | PROJ-17: Preset Sandbox Mode | Planned |

## Success Metrics
- Aktiv geteilte Setups: Nutzer mit `is_public = true` auf Profil und mindestens einem Item
- Explore-Feed wird ohne Login aufgerufen (organische Entdeckung)
- Monatlich aktive Nutzer legen mindestens ein neues Item an
- Ziel Phase 1: 50 registrierte Nutzer, 10 öffentliche Profile

## Constraints
- Solo-Entwicklung (Side-Project), kein externes Budget
- Stack: Next.js + Supabase + Vercel (Free/Pro Tier)
- Dark Mode only, Petrol-Akzentfarbe — Design steht nicht zur Debatte
- Sprach-Regelung: UI-Texte Deutsch, Code/DB Englisch

## Non-Goals
- Kein Marktplatz oder Kauf/Verkauf-Funktion
- Keine Fitness- oder GPS-Tracking-Integration (kein Strava-Import für Phase 1; Komoot/Strava Tour-Daten-Import ist für Phase 2 vorbereitet, aber nicht implementiert)
- Kein nativer App-Store-Release — PWA im Browser reicht für MVP
- Kein Service-Log oder Wartungsintervall-Tracking in Phase 1
- Keine Preisdatenbank oder Komponentenwert-Bewertung

---

Use `/requirements` to create detailed feature specifications for each item in the roadmap above.
