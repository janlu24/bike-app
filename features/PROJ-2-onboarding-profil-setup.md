# PROJ-2: Onboarding & Profil-Setup

## Status: Architected
**Created:** 2026-04-30
**Last Updated:** 2026-04-30 (Tech Design added)

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

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
