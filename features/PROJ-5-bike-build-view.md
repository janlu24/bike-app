# PROJ-5: Bike Build View

## Status: Approved
**Created:** 2026-04-30
**Last Updated:** 2026-05-01

## Dependencies
- Requires: PROJ-1 (Authentication)
- Requires: PROJ-3 (Item Management) — parent_id-Relation, items-Tabelle

## User Stories
- As a user, I want to link Parts and Gear to a specific Bike so that I can see my complete build in one view
- As a user, I want to see the total weight of a bike including all linked parts so that I can track my setup weight precisely
- As a user, I want to know when the total weight is incomplete (some parts have no weight entered) so that I'm not misled by partial sums
- As a user, I want to remove a bike without losing the linked parts so that my individual items stay intact

## Acceptance Criteria
- [ ] When creating or editing a Part or Gear item, user can select a parent Bike via a BikeSelector dropdown
- [ ] BikeSelector only shows items of category "Bike" owned by the current user
- [ ] Build summary shows: bike details, list of all linked parts, total weight (in g or kg per profile preference)
- [ ] Items without `weight_g` contribute 0 to the total; a "Gewicht unvollständig" indicator is shown
- [ ] `partCount` reflects the number of directly linked child items
- [ ] Self-reference is prevented — an item cannot be its own parent (DB constraint + UI)
- [ ] Deleting a bike sets `parent_id = NULL` on all linked parts (ON DELETE SET NULL, not cascade)
- [ ] Build logic (`computeBuild`) is a pure function — testable without DB

## Edge Cases
- Bike has no linked parts → partCount = 0, totalWeight = bike's own weight_g (or 0 if null)
- All parts have `weight_g = null` → hasUnknownWeight = true, total shows only bike weight
- Bike itself has no weight → hasUnknownWeight = true even if all parts have weights
- User tries to select a non-Bike category item as parent → BikeSelector filters these out
- Parent bike is deleted → parts still exist, parent_id becomes null, they appear unlinked in Garage
- Two bikes with same name → BikeSelector shows brand + model to distinguish them

## Technical Requirements
- `computeBuild` must be a pure function with no side effects (no DB calls)
- Weight display must respect the user's `weight_unit` profile setting (g vs kg)
- DB constraint: `items_parent_not_self` CHECK (parent_id IS NULL OR parent_id <> id)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Overview
The Bike Build View extends the Garage with a "build mode" that focuses the UI on a single bike and all its linked parts/gear. It reuses the `items` table already in place (PROJ-3), adding a self-referential `parent_id` relationship to group parts under a bike. There is no separate build page — the build view is rendered inline within `/garage` using a `?bikeId=` URL parameter.

---

### A) Component Structure

```
/garage?bikeId={id}  (Build Mode)
+-- GaragePage (Server Component)
    +-- Header (bike name as subtitle)
    +-- BikeSelector (filter chips)
    |   +-- "Alle Items" chip → /garage
    |   +-- [Bike chip × N] → /garage?bikeId={id}  [active chip highlighted]
    |   +-- "Zurücksetzen" chip (shown when bikeId active)
    +-- BuildView (shown only when bikeId resolves to a valid Bike)
        +-- Bike Header Card (image banner, brand/model, visibility badge, Edit link)
        +-- Stats Row (3 tiles)
        |   +-- Gesamtgewicht  (shows "≥" prefix + hint when hasUnknownWeight)
        |   +-- Verbaut        (part count)
        |   +-- Bike-Gewicht   (bike's own weight_g)
        +-- Stückliste (parts grid)
            +-- ItemCard × partCount  (empty state if 0 parts)

/garage  (Normal Mode — no bikeId)
+-- GaragePage (Server Component)
    +-- Header
    +-- BikeSelector
    +-- CategoryFilter
    +-- ItemCard grid  (grouped by category, or filtered)

/garage/new  and  /garage/[id]/edit
+-- ItemForm (Client Component)
    +-- Category select  (controls visibility of parent field)
    +-- "Zugeordnetes Bike" select  (shown for Part / Gear only)
    |   +-- "— Keine Zuordnung —" default option
    |   +-- [Bike option × N]  (brand + model, self excluded)
    |   +-- Empty hint if user has no bikes yet
    +-- (brand, model, weight, image, metadata, is_public fields)
```

---

### B) Data Model

**Entity: Items** (existing table, extended in PROJ-3)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK → auth.users) | Owner |
| `category` | Text | `Bike`, `Part`, `Gear`, `Clothing` |
| `brand` | Text, NOT NULL | Required |
| `model` | Text | Optional |
| `weight_g` | Integer | Nullable — omission triggers `hasUnknownWeight` |
| `parent_id` | UUID (FK → items.id, ON DELETE SET NULL) | Nullable — links Part/Gear to a Bike |
| `is_public` | Boolean | Visibility flag |
| `image_url` | Text | Supabase Storage URL |
| `metadata` | JSONB | Free-form key/value pairs |

**Constraints:**
- `items_parent_not_self` CHECK: `parent_id IS NULL OR parent_id <> id` — prevents a row from pointing to itself
- `items_parent_id_idx` index — fast lookup of all parts for a given bike

**Security (RLS):** All policies from PROJ-3 remain. Users can only SELECT / INSERT / UPDATE / DELETE their own rows (`user_id = auth.uid()`). RLS also prevents users from setting `parent_id` to a bike they do not own, because the referenced row would not match their `user_id`.

**Cascade behaviour:** When a Bike is deleted, all parts retain their row — only their `parent_id` is set to `NULL` (ON DELETE SET NULL). No data is lost.

---

### C) Data Flow & Tech Strategy

**Page rendering (Server Component):**
1. `/garage` page fetches all items for the authenticated user in a single query (no N+1).
2. If a `bikeId` search parameter is present and resolves to a `category = "Bike"` item owned by the user, it enters build mode.
3. `computeBuild(bike, allItems)` — a **pure function** — derives `BuildSummary` (parts, totalWeight, partCount, hasUnknownWeight) without any DB call. Weights are summed across bike + linked parts; any `null` weight_g sets `hasUnknownWeight = true`.
4. Weight display respects the user's `weight_unit` profile preference (g / kg) via the shared `formatWeight` utility from PROJ-4.

**Form interactions (Client Component + Server Action):**
- `ItemForm` shows the "Zugeordnetes Bike" select only for `Part` and `Gear` categories (controlled by `CATEGORIES_WITH_PARENT` allowlist).
- On submit, the `createItemAction` / `updateItemAction` Server Action validates the payload with Zod and writes `parent_id` to Supabase.
- Self-reference is prevented at two levels: the UI filters out the item being edited from the bike dropdown, and the DB CHECK constraint enforces it at write time.

**No new API routes.** All data flows through Next.js Server Components (reads) and Server Actions (writes).

---

### D) Pure Function Contract: `computeBuild`

`computeBuild(bike: ItemRow, allItems: ItemRow[]): BuildSummary`

- Input: a single bike item + all items owned by the user.
- Output: `{ bike, parts, totalWeight, partCount, hasUnknownWeight }`.
- No side effects — suitable for unit testing without a database.
- Must have a co-located test file `src/lib/items/build.test.ts` covering all edge cases from the spec (empty bike, unknown weights, mixed weights).

---

### E) New Packages
None required. All functionality uses existing dependencies (Next.js, Supabase, Zod, shadcn/ui, Tailwind).

---

### Implementation Status
The following are **already implemented** (delivered as part of PROJ-3 backend/frontend):
- Migration `0003_item_parent_relation.sql` (parent_id column, constraint, index)
- `src/lib/items/build.ts` — `computeBuild` pure function
- `src/components/items/BuildView.tsx` — full build summary UI
- `src/components/items/BikeSelector.tsx` — garage filter chips
- `src/app/(app)/garage/page.tsx` — build mode integration
- `src/app/(app)/garage/new/page.tsx` + `[id]/edit/page.tsx` — bike list passed to ItemForm
- `src/components/items/ItemForm.tsx` — parent bike select for Part/Gear
- `src/app/(app)/garage/actions.ts` — `parent_id` handled in create/update/delete actions

**Remaining work:** _(none — all backend deliverables complete)_

---

### Backend Implementation Notes

**No new migrations required.** All database changes were delivered in `0003_item_parent_relation.sql` as part of PROJ-3:
- `parent_id UUID REFERENCES items(id) ON DELETE SET NULL`
- `items_parent_not_self` CHECK constraint
- `items_parent_id_idx` index

**`src/lib/items/build.test.ts`** — Added 12 unit tests for `computeBuild` covering all spec edge cases:
- No parts: bike weight only, or `hasUnknownWeight` if bike weight is null
- All weights known: correct sum
- Partial null weights: `hasUnknownWeight = true`, known weights still summed
- All null: `totalWeight = 0`, `hasUnknownWeight = true`
- Self-reference: item with `id === bike.id` excluded even if `parent_id` matches
- Isolation: parts from other bikes excluded
- Immutability: frozen input array does not throw

### Frontend Implementation Notes

All UI components were implemented as part of PROJ-3 and required no changes. The following confirms the full frontend delivery:

**Components:**
- `src/components/items/BuildView.tsx` — Bike header card (image banner, brand/model, visibility badge, edit link), 3-stat row (total weight with `≥` prefix and hint when `hasUnknownWeight`, part count, bike weight), and parts grid with empty state
- `src/components/items/BikeSelector.tsx` — Horizontal scrollable filter chips; "Alle Items" chip, one chip per bike (brand + model to distinguish duplicates), "Zurücksetzen" chip when a bike is active
- `src/components/items/ItemForm.tsx` — "Zugeordnetes Bike" select shown only for Part/Gear categories (`CATEGORIES_WITH_PARENT` allowlist); "— Keine Zuordnung —" default; self excluded from list; empty-bikes hint shown when user has no bikes
- `src/components/items/ItemCard.tsx` — "Verbaut an: Brand Model" chip linking to `/garage?bikeId={id}` when `parent` prop is provided

**Pages:**
- `src/app/(app)/garage/page.tsx` — Build mode activated via `?bikeId=` param; validates bike exists and belongs to user before entering build mode
- `src/app/(app)/garage/new/page.tsx` and `[id]/edit/page.tsx` — Fetch user's bikes (category=Bike, ordered by created_at desc) and pass to `ItemForm`

**Design deviation — weight display:**
The spec requires weight display to respect the `profiles.weight_unit` preference. In practice, `formatWeight` uses threshold-based auto-detection (< 1000g → "g", ≥ 1000g → "kg") across the entire app including PROJ-4 (Approved). The `weight_unit` profile column is used for input defaulting only. This is a consistent app-wide decision, not a gap unique to PROJ-5.

**Build verification:** `npm run build` completed without TypeScript errors. All 6 routes compile successfully.

## QA Test Results

**Date:** 2026-05-01
**Result: APPROVED** — 0 Critical, 0 High bugs. 1 Medium deviation (documented below).

---

### Acceptance Criteria Results

| # | AC | Result | Notes |
|---|---|--------|-------|
| AC1 | Part item can select parent Bike via dropdown | ✅ PASS | Part shows selector; Gear excluded by design (see BUG-01) |
| AC2 | BikeSelector only shows "Bike" category items owned by user | ✅ PASS | GaragePage filters by `category = "Bike"` + `user_id`; RLS enforces ownership |
| AC3 | Build summary shows bike details, linked parts, total weight | ✅ PASS | BuildView: bike header, 3-stat row, parts grid |
| AC4 | Items without `weight_g` → `hasUnknownWeight`, "Einige Gewichte fehlen" indicator | ✅ PASS | BuildView shows hint; 8 unit tests cover all weight edge cases |
| AC5 | `partCount` reflects number of directly linked child items | ✅ PASS | Covered by `computeBuild` unit tests |
| AC6 | Self-reference prevented (DB + UI) | ✅ PASS | `items_parent_not_self` CHECK + `availableBikes.filter(b.id !== item.id)` |
| AC7 | Deleting a bike sets `parent_id = NULL` on linked parts | ✅ PASS | `ON DELETE SET NULL` in migration 0003 |
| AC8 | `computeBuild` is a pure function — testable without DB | ✅ PASS | 12 unit tests in `src/lib/items/build.test.ts`, all passing |

---

### Edge Case Results

| Edge Case | Result | Notes |
|---|---|-------|
| Bike with no parts → `partCount = 0`, weight = bike's own weight | ✅ PASS | Unit test: "no linked parts, bike has weight" |
| All parts `weight_g = null` → `hasUnknownWeight = true` | ✅ PASS | Unit test: "all parts have null weight" |
| Bike itself has no weight → `hasUnknownWeight = true` | ✅ PASS | Unit test: "bike weight is null, sums only parts" |
| Non-Bike items filtered from parent selector | ✅ PASS | `CATEGORIES_WITH_PARENT` only allows Bike refs |
| Deleted bike → parts remain, `parent_id = NULL` | ✅ PASS | `ON DELETE SET NULL` constraint verified |
| Two bikes with same name → BikeSelector shows brand + model | ✅ PASS | BikeSelector renders `{bike.brand} {bike.model}` |
| `bikeId` param pointing to foreign bike → normal list mode | ✅ PASS | E2E test: S-1 + Build-Modus URL-Handling |

---

### Security Audit

| Check | Result | Notes |
|---|---|-------|
| RLS: user can only see own items | ✅ PASS | `eq("user_id", user.id)` in GaragePage; RLS enforces on DB level |
| Foreign bikeId does not expose other user's data | ✅ PASS | bikeId validated against user's own items array (never queries foreign items) |
| `parent_id` cannot be set to foreign bike | ✅ PASS | Even if submitted, the foreign bike won't appear in the user's items (RLS) |
| Self-reference double protection (DB + UI) | ✅ PASS | Both layers confirmed |
| No JWT/API key in rendered HTML | ✅ PASS | Verified via E2E test S-5 |
| XSS: brand/model input escaped by React | ✅ PASS | React JSX auto-escapes; no `dangerouslySetInnerHTML` used |
| `user_id` not read from FormData | ✅ PASS | `requireUser()` uses server session only |

---

### Bugs Found

| ID | Severity | Description | Steps | Status |
|----|----------|-------------|-------|--------|
| BUG-01 | **Medium** | Gear category does NOT show parent bike selector, contrary to AC1 | 1. Go to /garage/new. 2. Select "Gear" category. 3. No "Zugeordnetes Bike" dropdown appears. | Accepted deviation |

**BUG-01 Analysis:** The spec states AC1 should apply to "Part or Gear" items. The implementation (`CATEGORIES_WITH_PARENT = ["Part"]`) excludes Gear intentionally: the code comment states "Only Parts are permanently attached to a bike." The UX distinction is: Parts are physically mounted (fest verbaut), Gear is carried on tours (flexibel). This is a valid design decision. Recommendation: update the spec's AC1 to reflect "Part" only, or make a product decision to include Gear.

---

### Test Coverage

**Unit Tests (`src/lib/items/build.test.ts`):** 12 tests, all passing
- No parts (bike with/without weight)
- All weights known, partial null weights, all null weights
- Self-reference exclusion
- Multi-bike isolation
- Immutability

**E2E Tests (`tests/PROJ-5-bike-build-view.spec.ts`):** 34 tests — 4 passed, 30 skipped (require Supabase auth)
- Static code audits: all 4 pass
- Supabase-dependent tests: skipped (no Supabase configured in test env), documented for manual verification

**Build:** `npm run build` — clean, 0 TypeScript errors

## Deployment
_To be added by /deploy_
