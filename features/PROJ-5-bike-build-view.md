# PROJ-5: Bike Build View

## Status: In Review
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

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
