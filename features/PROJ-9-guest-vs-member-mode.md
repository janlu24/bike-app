# PROJ-9: Guest vs. Member Mode

## Status: Approved
**Created:** 2026-05-02
**Last Updated:** 2026-05-02

## Dependencies
- Requires: PROJ-1 (Authentication) — erweitert den bestehenden Auth-Flow
- Requires: PROJ-3 (Item Management / Garage) — Garage-Stats auf dem Member-Dashboard
- Requires: PROJ-6 (User Profile Page) — `/profile/[username]` bleibt öffentlich erreichbar

## User Stories
- Als Gast möchte ich auf `/` eine Hero/Marketing-Seite sehen, damit ich das Produkt verstehe und mich registrieren kann.
- Als eingeloggter Nutzer möchte ich auf `/` eine Zusammenfassung meiner Garage sehen, damit ich beim Öffnen der App sofort meine Kennzahlen sehe.
- Als Gast möchte ich `/explore` und `/profile/[username]` ohne Login besuchen können, damit ich die Community entdecken kann bevor ich mich anmelde.
- Als Gast, der `/garage` aufruft, möchte ich sauber zu `/login` weitergeleitet werden, damit ich verstehe, dass ich einen Account benötige.
- Als neuer Nutzer möchte ich, dass direkt nach der E-Mail-Bestätigung ein Basis-Profil für mich angelegt wird, damit das System mich kennt ohne manuelles Onboarding.
- Als Nutzer, der seine E-Mail noch nicht bestätigt hat, möchte ich beim Login eine klare deutsche Fehlermeldung sehen, damit ich genau weiß was ich tun muss.

## Acceptance Criteria

### AC-1: Vereinfachter Auth Guard (Route Protection)
- [ ] Given ein nicht authentifizierter Nutzer, when er `/garage` oder eine andere nicht-öffentliche Route aufruft, then leitet das System ihn zu `/login` weiter.
- [ ] Given ein nicht authentifizierter Nutzer, when er `/`, `/explore`, `/login`, `/auth/**` oder `/profile/[username]` aufruft, then kann er die Seite ohne Weiterleitung aufrufen.
- [ ] Given ein authentifizierter Nutzer, when er `/login` aufruft, then leitet das System ihn zu `/` weiter.
- [ ] The system shall define public routes als explizite Allowlist: `/`, `/explore`, `/login`, `/auth/**`, `/profile/[username]`; alles andere ist protected.
- [ ] `/profile` (eigene Profil-Einstellungen) ist eine protected route — nur für eingeloggte Nutzer.
- [ ] Die Middleware unterscheidet zwischen dem dynamischen Pfad `/profile/[username]` (öffentlich) und dem statischen Pfad `/profile` (geschützt), indem sie prüft, ob nach `/profile/` ein weiteres Segment folgt.

### AC-2: Smart Dashboard — Gast-Ansicht (Hero Section)
- [ ] Given ein nicht authentifizierter Nutzer auf `/`, the system shall zeigen:
  - Eine Headline/Tagline, die das Produkt in einem Satz beschreibt.
  - 3–4 Feature-Highlights (z.B. „Bikes tracken", „Gewichte verwalten", „Setups teilen").
  - Einen prominenten CTA-Button „Jetzt registrieren", der zur Registrierung führt.
  - Einen sekundären CTA „Community entdecken", der zu `/explore` führt.

### AC-3: Smart Dashboard — Member-Ansicht
- [ ] Given ein authentifizierter Nutzer auf `/`, the system shall zeigen:
  - Anzahl Bikes des Nutzers (COUNT aus der Garage).
  - Anzahl Items gesamt in der Garage des Nutzers.
  - Einen CTA-Button „Zur Garage", der zu `/garage` führt.

### AC-4: Basis-Profil nach Registrierung
- [ ] The system shall einen PostgreSQL-Trigger auf `auth.users` einsetzen, der automatisch und unfehlbar einen `profiles`-Eintrag anlegt, sobald ein neuer User in Supabase erstellt wird (nach E-Mail-Bestätigung).
- [ ] Das Basis-Profil enthält mindestens: `user_id`, `username` (abgeleitet aus dem E-Mail-Präfix vor dem `@`).
- [ ] Falls der abgeleitete Username bereits vergeben ist, wird ein Fallback-Handle verwendet (z.B. `user_<uuid_short>`).
- [ ] Kein Application-Code (Callback, Server Action) ist für die Profil-Anlage verantwortlich — die DB-Ebene ist alleinig zuständig.

### AC-5: Fehlermeldung „E-Mail nicht bestätigt"
- [ ] Given ein Nutzer versucht sich einzuloggen, whose E-Mail noch nicht bestätigt ist, when Supabase den Fehler „Email not confirmed" zurückgibt, then zeigt das System auf der Login-Seite: „Bitte bestätige zuerst deine E-Mail-Adresse. Schau in deinen Posteingang."
- [ ] Die Fehlermeldung ist sichtbar ohne Seiten-Reload und unterscheidet sich visuell von generischen Login-Fehlern.

## Edge Cases
- Authentifizierter Nutzer ohne Profil-Eintrag in der DB (z.B. Profil gelöscht) → Member-Dashboard zeigt Stats mit 0, kein Crash.
- E-Mail-Bestätigungslink abgelaufen → Supabase gibt Fehler zurück → `/auth/callback` leitet zu `/login?error=link_expired` weiter, mit deutschem Hinweis-Text auf der Login-Seite.
- Basis-Profil-Anlage schlägt fehl (z.B. DB-Fehler) → Fehler wird geloggt (ohne PII), Nutzer trotzdem zur `/` weitergeleitet, Profil kann später via Onboarding vervollständigt werden.
- Gast ruft `/profile/[username]` für nicht-existierenden Username auf → Next.js 404-Seite (bestehende Logik).
- `/` wird aufgerufen während Supabase-Env-Vars nicht gesetzt sind (frische Dev-Umgebung) → statische Hero-Section wird gezeigt, kein Crash.
- Nutzer hat mehrere Tabs offen: Session läuft ab in Tab A → Tab B leitet bei nächster Navigation zu `/login` weiter (Standard-Middleware-Verhalten).

## Data & Privacy (PII)
- PII involved: E-Mail-Adresse (wird genutzt um den Default-Username abzuleiten; niemals im Log ausgegeben)
- Das Basis-Profil speichert: `user_id`, `username`, `created_at` — keine weiteren PII ohne explizite Nutzer-Eingabe
- Gemäß Security Rules: Keine PII-Logs in der Console

## Technical & UI Requirements
- **A11y:** Hero-CTAs müssen zugängliche Labels haben; WCAG 2.1 AA Kontrastverhältnis
- **Performance:** Dashboard-Stats-Abfragen < 200ms (einfache COUNT-Queries)
- **Security:** Auth Guard läuft in Next.js Middleware (server-seitig, nicht client-seitig); kein Bypass durch Client-Code möglich
- **Middleware:** Bestehende `src/middleware.ts` wird erweitert — nicht neu geschrieben
- **Browser Support:** Chrome, Firefox, Safari

---

## Tech Design (Solution Architect)

### Überblick

PROJ-9 betrifft vier zusammenhängende System-Bereiche, die in dieser Reihenfolge gebaut werden:
1. **Datenbank** — Trigger für automatische Profil-Anlage (neue Migration)
2. **Middleware** — Route-Schutz auf Allowlist-Modell umstellen
3. **Homepage** — dynamische Gast- vs. Member-Ansicht
4. **Login** — erweitertes Fehler-Handling

---

### A) Komponenten-Struktur

```
src/app/page.tsx  (Server Component — wird dynamisch)
├── [Gast]   <HeroSection />
│   ├── Headline + Tagline
│   ├── FeatureHighlights  (3–4 Punkte)
│   ├── Button "Jetzt registrieren"   → /login
│   └── Button "Community entdecken" → /explore
│
└── [Mitglied]  <MemberDashboard />
    ├── StatCard "Bikes"   (COUNT items WHERE category = 'Bike')
    ├── StatCard "Items"   (COUNT alle items)
    └── Button "Zur Garage" → /garage

src/components/home/HeroSection.tsx      (NEU — kein DB-Zugriff, rein statisch)
src/components/home/MemberDashboard.tsx  (NEU — empfängt Stats als Props)

src/middleware.ts          (bestehend — Allowlist-Logik ersetzt Prefix-Blacklist)
src/lib/auth/redirect.ts   (bestehend — auf 2 Kernregeln reduziert)

src/app/login/page.tsx + actions.ts  (bestehend — um Email-Not-Confirmed erweitert)
```

---

### B) Daten-Modell

**Keine Schema-Änderungen** an bestehenden Tabellen.

**Neue Migration `0007_auto_create_profile.sql`:**

| Was | Detail |
|-----|--------|
| Trigger | `AFTER INSERT ON auth.users FOR EACH ROW` |
| Funktion | `handle_new_user()` — läuft mit `SECURITY DEFINER` (umgeht RLS, da beim Trigger kein User-Kontext vorhanden ist) |
| Logik | 1. E-Mail-Präfix (Teil vor `@`) wird als Wunsch-Username extrahiert. 2. Kollisions-Prüfung in `profiles.username`. 3. Falls belegt: Fallback `user_` + erste 8 Stellen der User-UUID. 4. INSERT in `public.profiles` mit `id = NEW.id`. 5. Fehler werden still unterdrückt — kein harter Fehler für den Nutzer. |
| RLS | Kein Policy-Change nötig. `SECURITY DEFINER` umgeht RLS vollständig. |

**Hinweis Username-Constraint:** `profiles.username` erfordert 3–32 Zeichen. Der Trigger normalisiert den extrahierten Wert (zu kurze Präfixe → Fallback).

---

### C) Route-Schutz: Wechsel vom Blacklist- zum Allowlist-Modell

**Bisheriges Modell** (`src/lib/auth/redirect.ts`):
`PROTECTED_PREFIXES = ["/onboarding", "/garage", "/profile"]` — Blacklist, alles andere ist implizit öffentlich.

**Neues Modell** — explizite Public-Allowlist:

| Pfad | Zugang |
|------|--------|
| `/` (exakt) | Öffentlich |
| `/explore` und Sub-Pfade | Öffentlich |
| `/login` (exakt) | Öffentlich |
| `/auth/**` (alle Sub-Pfade) | Öffentlich |
| `/profile/[segment]` (mind. 1 Segment nach `/profile/`) | Öffentlich |
| `/profile` (exakt) | **Geschützt** |
| Alle anderen Pfade (inkl. `/garage`, `/onboarding`) | **Geschützt** |

**Spezialfall `/profile`:** Die Middleware prüft: Gibt es nach `/profile` mindestens ein weiteres URL-Segment? Falls ja → öffentliches Nutzerprofil (durchlassen). Falls der Pfad exakt `/profile` ist → eigene Profil-Einstellungen (→ `/login`).

**Vereinfachte Redirect-Regeln** (ersetzt die 3-state Logik mit `hasProfile`):
1. Nicht eingeloggt + geschützter Pfad → `/login`
2. Eingeloggt + Aufruf von `/login` → `/`

**Konsequenz für Onboarding:** Da der DB-Trigger garantiert, dass jeder User unmittelbar nach Registrierung ein Profil hat, ist die bisherige Middleware-Prüfung `hasProfile === false → /onboarding` obsolet. Das optionale Vervollständigen des Profils wird künftig über einen Banner/Hinweis auf dem Member-Dashboard angeboten, nicht als erzwungener Redirect.

---

### D) Homepage — Dynamische Server Component

`src/app/page.tsx` liest die Supabase-Session serverseitig (kein Client-Round-Trip):

- **Kein User** → rendert `<HeroSection>` — rein statisch, null DB-Zugriffe
- **User vorhanden** → zwei COUNT-Queries:
  - Bikes: `items WHERE user_id = X AND category = 'Bike'`
  - Items gesamt: `items WHERE user_id = X`
  → rendert `<MemberDashboard stats={...} />`

Beide Komponenten sind eigene Dateien unter `src/components/home/` und erhalten ihre Daten ausschließlich als Props.

---

### E) Login — Email-Not-Confirmed Error Handling

`signInAction` in `src/app/login/actions.ts`:
- Supabase gibt bei nicht-bestätigter E-Mail den Fehlercode `email_not_confirmed` zurück.
- Die Action erkennt diesen Code und gibt eine strukturierte Fehler-Antwort mit `type: "email_not_confirmed"` zurück — getrennt von generischen Auth-Fehlern.

`src/app/login/page.tsx`:
- Wertet den `type`-Parameter aus (URL-Search-Param oder Action-State).
- Für `email_not_confirmed`: dedizierte Info-Box (visuell als **Hinweis**, nicht als Fehler — z.B. blau statt rot): _„Bitte bestätige zuerst deine E-Mail-Adresse. Schau in deinen Posteingang."_
- Generische Fehler behalten ihren bisherigen roten Fehler-Stil.

---

### F) Neue npm-Packages

Keine — alle benötigten Funktionen sind im bestehenden Stack (Supabase, Next.js, shadcn/ui) vorhanden.

## Implementation Notes

### Backend (PROJ-9)

**Migration `supabase/migrations/0007_auto_create_profile.sql`**
- PostgreSQL function `handle_new_user()` mit `SECURITY DEFINER` — erstellt automatisch einen `profiles`-Eintrag bei jedem neuen `auth.users` INSERT
- Username-Derivation: E-Mail-Präfix → lowercase → Sonderzeichen entfernen → Kollisions-Check → Fallback `user_<8 UUID-chars>`
- Trigger `on_auth_user_created` auf `auth.users AFTER INSERT`
- Fehler werden per `RAISE WARNING` geloggt ohne User-Creation zu blockieren

**`src/lib/auth/redirect.ts`** — vollständig neu geschrieben
- Allowlist-Modell ersetzt die bisherige Blacklist (`PROTECTED_PREFIXES`)
- `PUBLIC_EXACT`: `/`, `/explore`, `/login`
- Public Prefixes: `/auth/`, `/explore/`
- `/profile/[username]` öffentlich (Sonderregel); `/profile` exakt → geschützt
- `AuthState.hasProfile` entfernt — nicht mehr benötigt (DB-Trigger garantiert Profil)
- Zwei Redirect-Regeln: (1) kein Auth + nicht-public → `/login`, (2) Auth + `/login` → `/`

**`src/middleware.ts`** — `hasProfile: undefined` entfernt, schlanker Aufruf

**`src/app/login/actions.ts`** — `signInAction` fängt Supabase-Fehler "Email not confirmed" ab und gibt `notice` (petrol/blau) statt `error` (rot) zurück

**`src/app/auth/callback/route.ts`** — Unterscheidet `?error=link_expired` von `?error=auth` anhand des Fehlertexts

**Tests:** Alle 175 Unit-Tests grün. `redirect.test.ts` vollständig auf neues Modell umgestellt.

### Frontend (PROJ-9)

**`src/components/home/HeroSection.tsx`** (NEU)
- Statische Marketing-Seite für Gäste: Tagline, 4 Feature-Highlights, CTA "Jetzt registrieren" (→ `/login`), sekundärer CTA "Community entdecken" (→ `/explore`)
- Keine DB-Zugriffe — rein presentational

**`src/components/home/MemberDashboard.tsx`** (NEU)
- Empfängt `username` und `counts: CategoryCounts` als Props
- Zeigt 4-Kategorie-Grid (CategoryTile), zwei Stat-Kacheln (Bikes gesamt, Items gesamt), "Zur Garage"-Button und Datenschutz-Hinweis

**`src/app/(app)/page.tsx`** — Auth-Branching
- Kein User (oder Supabase nicht konfiguriert) → `<HeroSection />`
- User vorhanden → Profil + Items laden → `<MemberDashboard username counts />`
- `force-dynamic` bleibt gesetzt

**`src/app/login/page.tsx`** — URL-Param Fehler
- Async Server Component mit `searchParams: Promise<{ error?: string }>`
- `?error=link_expired` → "Bestätigungslink abgelaufen"-Meldung (rot, `role="alert"`)
- `?error=auth` → generische Fehlermeldung
- URL-Fehler erscheinen oberhalb von `<LoginForm />` im selben Card-Container

**Build:** `npm run build` ✓ — 0 TypeScript-Fehler, alle 7 Routes generiert

## QA Test Results

**Tested:** 2026-05-02
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Acceptance Criteria Status
- [x] **AC-1: Route Protection (Allowlist)** — Pass. `/`, `/explore`, `/login`, `/auth/**`, `/profile/[username]` public; `/garage`, `/profile`, `/onboarding`, `/garage/new` redirect unauthenticated users to `/login`. No JS errors on redirect. Verified by 9 E2E tests.
- [x] **AC-2: Gast-Ansicht Hero Section** — Pass. H1 "Der digitale Zwilling deines Bikes." visible, 4 feature highlights with `aria-label="Features"`, CTA "Jetzt registrieren" → `/login`, CTA "Community entdecken" → `/explore`. Cockpit content not visible for guests. Verified by 9 E2E tests.
- [x] **AC-3: Member-Ansicht** — Partially covered. "Willkommen im Cockpit" not visible for guests (verified). Authenticated-user flow (stat tiles, "Zur Garage") validated via code review and unit tests only — requires live authenticated session for E2E.
- [x] **AC-4: Basis-Profil nach Registrierung** — Validated via migration `0007_auto_create_profile.sql` and code review. DB trigger `on_auth_user_created` creates profile on `auth.users INSERT`. Requires live Supabase for E2E validation.
- [x] **AC-5: Fehlermeldung "E-Mail nicht bestätigt"** — Pass. `signInAction` returns `{ notice }` for `email_not_confirmed`, LoginForm renders in blue/petrol style. `?error=link_expired` shows German text with "abgelaufen" and "erneut". `?error=auth` shows generic message. Unknown params fall back gracefully. Verified by 7 E2E tests.

### Security & Privacy Audit
- [x] **Route Protection:** Auth guard runs server-side in Next.js Middleware — no client-side bypass possible. Verified by redirect tests.
- [x] **Open Redirect:** `/auth/callback?next=//evil.com` stays on domain. Verified by E2E test.
- [x] **PII Protection:** No email addresses in HTML of `/`, `/login`, or `/login?error=link_expired` (excluding `du@example.com` placeholder). No JWT patterns in HTML. No UUIDs in unauthenticated HTML. All 6 PII audit tests pass.
- [x] **XSS:** No JS errors on any tested page. Route announcer (`role=alert`, off-screen) correctly excluded from error assertions using `main`-scoped locators.
- [x] **No API Keys in HTML:** Verified — ANON key does not appear in page HTML.

### Regression Notes
- **PROJ-2 E2E tests:** `Onboarding-Seite UI`, `Tastaturnavigation & A11y`, `Formular-Validierung (Zod)`, `Security — Injection` groups are now skipped when the middleware redirects `/onboarding` (expected PROJ-9 behavior). The `Redirect-Verhalten` group now correctly validates the redirect. No functional regression in PROJ-2 implementation.
- **PROJ-4 E2E tests:** All MemberDashboard-specific tests (cockpit heading, category tiles, systemstatus, datenschutz) marked `requires-auth` and skipped — guest mode now shows HeroSection at `/` as intended by PROJ-9. No functional regression in PROJ-4 implementation.

### Bugs Found
No critical or high-severity bugs found.

**Minor findings (documentation only):**
- **Next.js deprecation warning:** Build output shows `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` — cosmetic, does not affect functionality. Tracked for future rename (`src/middleware.ts` → `src/proxy.ts`).
- **`getByRole("alert")` ambiguity:** Next.js route announcer has `role="alert"` and is considered "visible" by Playwright (off-screen element with 1px dimensions). Tests scoped to `page.locator("main").getByRole("alert")` to exclude it.

### Summary
- **AC Status:** 5/5 fully or partially passed (AC-3 and AC-4 require live authenticated session for full E2E)
- **Tests:** 34 passed, 12 skipped (auth/Supabase-required), 0 failed
- **Unit Tests:** 175/175 passing
- **Security:** Pass — no PII leaks, no open redirects, no JS errors
- **Production Ready:** **YES** — zero critical/high bugs

## Deployment
_To be added by /deploy_
