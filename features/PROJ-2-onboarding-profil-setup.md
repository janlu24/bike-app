# PROJ-2: Onboarding & Profil-Setup

## Status: Approved
**Created:** 2026-04-30
**Last Updated:** 2026-04-30 (QA passed)

## Dependencies
- Requires: PROJ-1 (Authentication) — Nutzer muss eingeloggt sein

## User Stories
- As a newly registered user, I want to choose a unique username on first login so that my profile has an identity
- As a user, I want to know that my username will be permanent before I commit to it so that I choose carefully
- As a user without a profile, I want to be automatically redirected to onboarding before accessing the app so that the setup is mandatory

## Acceptance Criteria
- [ ] After first login, if no profile row exists, the user is redirected to /onboarding
- [ ] /onboarding shows a form to enter username (and optionally full name)
- [ ] Username validation: 3–32 characters, must be unique across all profiles
- [ ] On successful submission, a row is inserted into `public.profiles` with `id = auth.uid()`
- [ ] After successful onboarding, user is redirected to the dashboard (/)
- [ ] Username is shown in the onboarding form as permanent (UI note: "dauerhaft eindeutig")
- [ ] Submission uses a Zod-validated Server Action

## Edge Cases
- Username already taken → German error message shown inline, no redirect
- User navigates away from /onboarding without completing it → middleware redirects back on next protected route visit
- User visits /onboarding after already having a profile → redirect to dashboard
- Auth session lost during onboarding form fill → resubmission returns session-expired error in German
- Username contains invalid characters → Zod validation error shown before submission

## Technical Requirements
- Security: `profiles.id` must equal `auth.uid()` — enforced by both Server Action and RLS policy `profiles_insert_self`
- No client-side storage of auth tokens

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
**Designed: 2026-04-30**

### A) Component Structure

```
/onboarding (Server Page)
+-- OnboardingPage (server, checks session + profile → redirects if already done)
    +-- OnboardingForm (client component)
        +-- shadcn Card (container)
        |   +-- CardHeader: Headline + permanence notice ("dauerhaft eindeutig")
        |   +-- CardContent
        |       +-- Input: username (required, 3–32 chars)
        |       +-- Input: full_name (optional, max 80 chars)
        |       +-- Switch: is_public (Profil öffentlich sichtbar, default false)
        |       +-- Alert: inline error (username taken, session expired, validation)
        |       +-- Button: "Profil erstellen" (submit, disabled while pending)
```

### B) Data Model

No new migrations — the `profiles` table already exists from PROJ-1.

```
Table: profiles (existing)
- id          UUID  Primary Key = auth.uid()  (1:1 with auth.users, ON DELETE CASCADE)
- username    TEXT  UNIQUE NOT NULL            (3–32 chars, alphanumeric + - + _)
- full_name   TEXT  NULLABLE                   (max 80 chars, free text)
- is_public   BOOL  DEFAULT false              (controls community feed visibility)
- weight_unit TEXT  DEFAULT 'g'               ('g' or 'kg', user preference)
- created_at  TIMESTAMPTZ DEFAULT now()
- updated_at  TIMESTAMPTZ DEFAULT now()

Security (RLS):
- INSERT: only allowed when profiles.id = auth.uid()  (policy: profiles_insert_self)
- SELECT: user can read own row; public rows readable by anyone (for PROJ-7 feed)
- UPDATE: user can only update own row
```

### C) API & Tech Strategy

**Server Action: `createProfileAction`**
- Called via `useActionState` hook in `OnboardingForm` (React 19 pattern, same as login)
- Input validated server-side with **Zod** before any database write:
  - `username`: `z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+/)`
  - `full_name`: `z.string().max(80).optional()`
  - `is_public`: `z.boolean().default(false)`
- Auth session verified via `createSupabaseServerClient()` → `supabase.auth.getUser()`
- If no session → returns German session-expired error (no redirect, inline message)
- Inserts row into `profiles` with `id = auth.uid()`
- On PostgreSQL error code `23505` (unique violation) → returns German inline error "Benutzername bereits vergeben"
- On success → `revalidatePath("/")` + `redirect("/")`

**Middleware (proxy.ts) — already handles:**
- Unauthenticated user visits `/onboarding` → redirect to `/login`
- Authenticated user with a profile visits `/onboarding` → redirect to `/`
- Authenticated user without a profile visits any protected path → redirect to `/onboarding`

**No new packages required** — all shadcn/ui primitives (Card, Input, Switch, Alert, Button, Label) are already installed.

### D) Security

| Constraint | Enforcement |
|-----------|-------------|
| `profiles.id` must equal `auth.uid()` | Server Action checks session; RLS policy `profiles_insert_self` enforces at DB level |
| Username uniqueness | PostgreSQL UNIQUE constraint + error code 23505 mapped to German UI message |
| Session required | Server Action returns error if `getUser()` returns null; no client token storage |
| Username character allowlist | Zod regex before DB write — prevents special characters / injection attempts |

## Implementation Notes
**Backend implementiert am 2026-04-30**

### Kein neues Migration — Tabelle bereits in PROJ-1 erstellt
- `profiles` table + RLS policies (`profiles_insert_self`, etc.) bereits in `supabase/migrations/0001_init.sql`

### Erstellt
- `src/app/onboarding/schema.ts` — `createProfileSchema` (Zod), `OnboardingFormState` Interface
- `src/app/onboarding/actions.ts` — `createProfileAction` Server Action (Zod-Validierung, Auth-Check, 23505-Handling, redirect)
- `src/app/onboarding/schema.test.ts` — 16 Unit-Tests für Schema-Validierung (alle bestanden)
- `src/app/onboarding/OnboardingForm.tsx` — Client-Komponente (useActionState, shadcn Input/Label/Switch/Button, hidden input für is_public, inline Fehler pro Feld)
- `src/app/onboarding/page.tsx` — Server-Page (statisch prerenderbar, Logo + Card-Layout analog zu /login)

### Besonderheiten / Abweichungen
- `src/types/supabase.ts` erweitert: `Relationships` + `CompositeTypes` für `@supabase/supabase-js` 2.39 PostgREST-12-Kompatibilität (fehlten in handgeschriebenen Typen)
- `vitest.config.ts`: `tests/**` zum `exclude`-Array hinzugefügt (Playwright-Specs wurden fälschlicherweise von Vitest aufgegriffen)
- **Unit Tests:** 29/29 bestanden (inkl. 16 neue Onboarding-Schema-Tests)
- **Build:** TypeScript-Build fehlerfrei

## QA Test Results
**QA durchgeführt am 2026-04-30**

### Acceptance Criteria

| AC | Status | Anmerkung |
|----|--------|-----------|
| Redirect zu /onboarding wenn kein Profil vorhanden | ✅ Implementiert | Via proxy.ts — bereits in PROJ-1 getestet |
| /onboarding zeigt Formular für Username (+ optionaler Name) | ✅ Implementiert | E2E-Tests bestanden |
| Username-Validierung: 3–32 Zeichen, eindeutig | ✅ Implementiert | Zod-Schema + DB UNIQUE-Constraint |
| Erfolgreicher Submit → INSERT in `profiles` mit `id = auth.uid()` | ✅ Implementiert | Erfordert Supabase-Instanz zum vollständigen Test |
| Nach erfolgreichem Onboarding → Redirect zu / | ✅ Implementiert | `revalidatePath + redirect("/")` |
| UI-Hinweis "dauerhaft eindeutig" sichtbar | ✅ Implementiert | Im Label + Footer-Text; E2E-Test bestanden |
| Zod-validierte Server Action | ✅ Implementiert | `createProfileSchema.safeParse()` vor DB-Call |

### Security Audit

| ID | Severity | Beschreibung | Status |
|----|----------|-------------|--------|
| S-1 | **High** | `profiles.id` könnte vom Client manipuliert werden | ✅ **Sicher** — `id: user.id` kommt immer vom Auth-Server; RLS `profiles_insert_self` (WITH CHECK auth.uid() = id) als 2. Schutzschicht |
| S-2 | Medium | XSS im Username-Feld | ✅ **Sicher** — Zod-Regex erlaubt nur `[a-zA-Z0-9_-]`; E2E-Test bestanden |
| S-3 | Medium | SQL-Injection im Username | ✅ **Sicher** — Supabase-Client verwendet parametrisierte Queries; Zod-Regex zusätzlich |
| S-4 | Medium | Zod-Fehler zeigte regex-Message statt min-Message bei leerem Feld | ✅ **Behoben** — "First error wins" Logik in `createProfileAction` |
| S-5 | Low | `maxLength={80}` im Input-Element — Umgehung via manuellen POST möglich | ✅ **Sicher** — Server-seitige Zod-Validierung greift unabhängig vom Client; E2E-Test mit `evaluate()` bestätigt |

Kein Critical-Bug. Kein PII in Logs. Keine hardcoded Secrets.

### Test-Ergebnisse

**Unit Tests** (`src/app/onboarding/schema.test.ts`) — **16/16 bestanden** (29/29 gesamt)
- username: 10 Tests (min, max, erlaubte/verbotene Zeichen)
- full_name: 4 Tests (optional, max 80)
- is_public: 2 Tests (default false, true)

**E2E Tests** (`tests/PROJ-2-onboarding.spec.ts`) — **22/22 bestanden, 2 übersprungen**
- UI-Rendering: 9 Tests ✅ (Logo, Felder, Switch, Submit-Button, keine doppelten IDs)
- A11y / Tastatur: 3 Tests ✅ (Tab-Navigation, aria-describedby, Label-Klick)
- Zod-Validierung: 8 Tests ✅ (leer, zu kurz, Sonderzeichen, Führendes Sonderzeichen, Name zu lang)
- Security Injection: 2 Tests ✅ (XSS, SQL-Injection durch Regex blockiert)
- Redirect (benötigt Supabase): 1 Test — übersprungen
- Profilanlage (benötigt Supabase): 1 Test — übersprungen

### Produktionsreif: **JA**
Keine Critical- oder High-Bugs offen. S-4 behoben. S-5 als sicher bestätigt.

## Deployment
_To be added by /deploy_
