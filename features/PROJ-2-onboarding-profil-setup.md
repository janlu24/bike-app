# PROJ-2: Onboarding & Profil-Setup

## Status: In Progress
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
