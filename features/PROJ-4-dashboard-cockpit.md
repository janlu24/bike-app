# PROJ-4: Dashboard / Cockpit

## Status: In Progress
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

## Dependencies
- Requires: PROJ-1 (Authentication)
- Requires: PROJ-2 (Onboarding & Profil-Setup) — für Usernamen-Anzeige
- Requires: PROJ-3 (Item Management) — für Item-Counts

## User Stories
- As a logged-in user, I want to see a quick overview of all my items grouped by category so that I have an instant inventory snapshot
- As a user, I want to see the system connection status so that I know if Supabase and Auth are functional
- As a user, I want to navigate directly to a category-filtered garage view by clicking a tile
- As a user, I want a prominent CTA to add a new item from the dashboard

## Acceptance Criteria
- [ ] Dashboard is the root route (/) and is server-rendered with `force-dynamic`
- [ ] Shows four category tiles: Bike, Part, Gear, Clothing — each with icon, label, count
- [ ] Counts show 0 for empty categories (never undefined or NaN)
- [ ] Clicking a category tile navigates to `/garage?category={category}`
- [ ] System status section shows: Supabase connection status, Auth session (username or anon), Theme
- [ ] Supabase status: "verbunden" (ok), "nicht erreichbar" (warn), "nicht konfiguriert" (muted)
- [ ] Auth session: `@{username}` (ok), "ohne Profil" (warn), "anonym" (muted)
- [ ] "Neues Item" button links to /garage/new and is always visible
- [ ] Auth + Profile + Items are fetched in parallel (Promise.all) to minimize latency
- [ ] Unauthenticated state: counts show 0, auth row shows "anonym"

## Edge Cases
- Supabase unreachable at render time → status shows "nicht erreichbar", page still renders
- User has a session but no profile row → "ohne Profil" shown, zero counts
- User has items but Supabase goes down mid-render → fallback to empty array, 0 counts
- New user (zero items) → all tiles show 0 with empty hint text per category

## Technical Requirements
- Performance: Auth, profile, and items queries must run in parallel, not sequentially
- Rendering: `export const dynamic = "force-dynamic"` to always fetch fresh data

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
