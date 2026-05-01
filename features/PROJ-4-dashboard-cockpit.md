# PROJ-4: Dashboard / Cockpit

## Status: In Progress
**Created:** 2026-04-30
**Last Updated:** 2026-05-01 (Backend lib files implemented)

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
**Designed: 2026-04-30**

### A) Component Structure

```
/ (Server Page — force-dynamic, reads auth + profile + items on every request)
+-- AppLayout (shared with /garage — sticky header + Logo + BottomNav)
+-- Header Section
|   +-- "Status" eyebrow label
|   +-- "Willkommen im Cockpit" heading
|   +-- Subtitle: "Dein digitaler Zwilling. Präzise. Privat. Teilbar."
|   +-- CTA Link: "Neues Item" → /garage/new (petrol button, always visible)
+-- CategoryGrid (2×2 mobile → 1×4 desktop)
|   +-- CategoryTile × 4 (Bike, Komponenten, Equipment, Bekleidung)
|       +-- Category icon (Lucide) + label
|       +-- Item count (large, monospace readout)
|       +-- Hint: "X angelegt" OR category empty hint if count = 0
|       +-- Entire tile is a Link → /garage?category={category}
+-- SystemStatus Card
|   +-- Gauge icon + "Systemstatus" heading
|   +-- StatusRow: Supabase — "verbunden" (petrol dot) / "nicht erreichbar" (amber) / "nicht konfiguriert" (muted)
|   +-- StatusRow: Auth-Session — "@username" (ok) / "ohne Profil" (warn) / "anonym" (muted)
|   +-- StatusRow: Theme — "dark · petrol" (ok)
+-- PrivacyNotice Card
    +-- Shield icon + "Datenschutz by Default"
    +-- Subtitle: items are private by default
```

**Layout consolidation:** The dashboard and garage share the same sticky header + BottomNav shell. To avoid duplicating this layout, the implementation should move both `/` and `/garage` into a shared `(app)` route group with a single `layout.tsx`. The login and onboarding pages remain in the root layout (bare, no nav).

```
src/app/
+-- (app)/               ← new route group (authenticated shell)
|   +-- layout.tsx       ← sticky header + BottomNav (moved from garage/layout.tsx)
|   +-- page.tsx         ← Dashboard (/)
|   +-- garage/
|       +-- page.tsx     ← Garage list
|       +-- new/
|       +-- [id]/edit/
+-- login/
+-- onboarding/
+-- layout.tsx           ← bare root layout (dark mode, fonts only)
```

### B) Data Model

No new migrations required — dashboard reads only from existing tables.

```
Reads (parallel fetch, all owned by session user):
- auth.users          → user session (via supabase.auth.getUser())
- profiles            → { username } for auth row display
                        RLS: owner sees own profile (auth.uid() = id)
- items               → { category } only (minimal select for counts)
                        RLS: auth.uid() = user_id (owner-only on dashboard)

External probe (no DB):
- probeSupabase()     → HTTP GET /auth/v1/health on the Supabase URL
                        Timeout: 1500 ms; returns "connected" | "offline" | "not_configured"
                        Runs in parallel with DB queries — non-blocking

Computed:
- aggregateCounts(items) → { total, byCategory: Record<ItemCategory, number> }
                           Zero-fills all 4 categories so UI never sees undefined
```

Security: All reads are scoped to the session user via RLS. The dashboard never exposes data from other users. The Supabase probe is a public health endpoint with no auth.

### C) API & Tech Strategy

**Data fetching pattern (parallel, not sequential):**

The dashboard starts the Supabase probe and the auth query simultaneously as soon as the page renders. Once the user is known, profile and items queries are fired in parallel via `Promise.all`. If any query fails (network error, Supabase offline), the page catches the error and falls back to empty/null — it always renders.

```
Server Page render:
  ├─ probeSupabase()           (parallel — HTTP, no auth)
  ├─ supabase.auth.getUser()   (parallel — cookie-based)
  └─ [if user]:
       ├─ profiles.select("username").eq("id", user.id)   \
       └─ items.select("category").eq("user_id", user.id)  } Promise.all
```

**New shared lib files** (needed by dashboard, reusable by future features):

| File | Purpose |
|------|---------|
| `src/lib/items/aggregate.ts` | `aggregateCounts(items)` — pure function; zero-fills all categories; fully testable without Supabase |
| `src/lib/system/status.ts` | `probeSupabase()` — lightweight HTTP health-check with abort timeout; returns typed status |

**Rendering:** `export const dynamic = "force-dynamic"` — always fetches fresh data, no stale caches. This is the right trade-off for a status dashboard where "live" data is the point.

**No API routes needed:** Everything is a direct Supabase SDK call inside a Server Component. No Server Actions (no mutations on this page).

### D) Dependencies

No new packages required. All Lucide icons (Gauge, Shield, Plus, category icons) and layout primitives are already installed.

## Implementation Notes (Backend — 2026-05-01)

**No migrations required.** Dashboard reads existing `profiles` and `items` tables via RLS-scoped queries.

**New lib files created:**

| File | Tests |
|------|-------|
| `src/lib/items/aggregate.ts` — `aggregateCounts()` pure function; zero-fills all 4 categories | `aggregate.test.ts` — 7 tests |
| `src/lib/system/status.ts` — `probeSupabase()` HTTP health-check with AbortController timeout | `status.test.ts` — 6 tests |

**Test suite:** 110/110 passing (13 new tests added). Build: clean (no TypeScript errors).

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
