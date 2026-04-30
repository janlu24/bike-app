# PROJ-1: Authentication

## Status: In Progress
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

## Implementation Notes
**Backend implementiert am 2026-04-30**

### Erstellt
- `supabase/migrations/0001_init.sql` — profiles + items Tabellen, RLS-Policies, Trigger
- `supabase/migrations/0002_item_images.sql` — image_url Spalte + Storage-Bucket mit Policies
- `supabase/migrations/0003_item_parent_relation.sql` — parent_id Self-Reference + brand NOT NULL
- `supabase/migrations/0004_weight_unit.sql` — profiles.weight_unit Präferenz
- `src/types/supabase.ts` — handgeschriebene DB-Types (Database, ItemRow, ProfileRow, ItemCategory)
- `src/lib/supabase/client.ts` — Browser-Client (createSupabaseBrowserClient)
- `src/lib/supabase/server.ts` — Server-Client async (createSupabaseServerClient)
- `src/lib/supabase/middleware.ts` — Middleware-Client (createMiddlewareClient)
- `src/lib/auth/redirect.ts` — Reine Redirect-Logik (decidePostAuthRedirect, isProtectedPath, isAuthPath)
- `src/proxy.ts` — Globaler Proxy (Next.js 16 Konvention; ersetzt middleware.ts)
- `src/app/auth/callback/route.ts` — Code-Exchange Route Handler (GET)
- `src/app/auth/signout/route.ts` — Sign-out Route Handler (POST, 303 Redirect)
- `src/app/login/schema.ts` — AuthFormState Interface
- `src/app/login/actions.ts` — signInAction + signUpAction Server Actions

### Besonderheiten / Abweichungen
- **Next.js 16:** Middleware-Konvention geändert: `middleware.ts` → `proxy.ts`, Export `middleware` → `proxy`
- **@supabase/ssr** neu installiert (fehlte im Starter-Template)
- **tsconfig.json:** `src/alt_bike software` explizit ausgeschlossen (verhindert TS-Fehler aus Legacy-Code)
- **Types-Pfad:** `src/types/supabase.ts` (gem. Backend-Regeln), nicht `src/lib/supabase/types.ts` wie im Altprojekt

### Noch offen (Frontend, PROJ-1)
- Login-Page UI (`src/app/login/page.tsx`, `LoginForm.tsx`) — folgt mit `/frontend`

## Dependencies
- None

## User Stories
- As an unregistered user, I want to create an account with email and password so that I can manage my equipment privately
- As a returning user, I want to log in so that I can access my personal data and setups
- As a logged-in user, I want to log out so that my account is secure on shared devices
- As an unauthenticated user, I want to be redirected to /login when accessing protected pages so that my data stays private
- As a user who registered via email, I want my auth callback handled correctly so that my session is established after email confirmation

## Acceptance Criteria
- [ ] Email/password registration via Supabase Auth works
- [ ] Email/password login works, session is established
- [ ] Sign-out clears the session and redirects to /login
- [ ] Middleware protects all routes except /login, /auth/callback, /auth/signout and /explore
- [ ] Auth callback at /auth/callback exchanges the code and redirects to dashboard or onboarding
- [ ] Auth-related error messages are shown in German
- [ ] Login form has client-side Zod validation before submission

## Edge Cases
- Invalid credentials → German error message, no session established
- Email not yet confirmed → appropriate German message shown
- Session expired → automatic redirect to /login on next protected route visit
- User who is already logged in visits /login → redirect to dashboard
- Auth callback receives an error code → redirect to /login with error param

## Technical Requirements
- Security: All auth state must come from `supabase.auth.getUser()` server-side, never from client-only state
- Middleware runs on Edge Runtime (Next.js middleware.ts)
- No secrets in client bundle

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
