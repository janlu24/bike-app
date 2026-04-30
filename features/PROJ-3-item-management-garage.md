# PROJ-3: Item Management / Garage

## Status: In Review
**Created:** 2026-04-30
**Last Updated:** 2026-04-30 (Frontend implementation complete)

## Dependencies
- Requires: PROJ-1 (Authentication)
- Requires: PROJ-2 (Onboarding & Profil-Setup) — `items.user_id` referenziert `profiles.id`

## User Stories
- As a user, I want to add a new item (Bike, Part, Gear, Clothing) so that I can track my equipment
- As a user, I want to upload an image for each item so that my inventory is visually identifiable
- As a user, I want to edit an existing item to keep my data up to date
- As a user, I want to delete an item when I no longer own it
- As a user, I want to filter my items by category on the /garage page so that I can focus on what I need
- As a user, I want to set each item as public or private to control whether it appears in my public profile
- As a user, I want to add flexible metadata (JSONB) to items so that I can store category-specific details

## Acceptance Criteria
- [ ] Create, read, update, delete items at /garage, /garage/new, /garage/[id]/edit
- [ ] Item categories: Bike, Part, Gear, Clothing (enum, not free text)
- [ ] Required fields: category, brand, model
- [ ] Optional fields: weight_g (integer, ≥ 0), image, metadata (key-value pairs), is_public, parent_id
- [ ] Image upload: max 5 MB, accepted formats: JPEG, PNG, WebP, AVIF
- [ ] Images are stored in Supabase Storage bucket `item-images` under `{userId}/{timestamp}-{random}.{ext}`
- [ ] User can remove an existing image from an item ("Bild entfernen" toggle)
- [ ] Category filter on /garage page filters the item list without full page reload
- [ ] All mutations are Server Actions (no client-side fetch)
- [ ] RLS: users can only see/edit/delete their own items
- [ ] Validation via Zod on the server side before any DB write

## Edge Cases
- Image > 5 MB → German error message, no upload attempted
- Invalid file type → German error message
- Storage upload succeeds but DB insert fails → uploaded image is deleted (rollback)
- Delete item that has child parts → `parent_id` of children is set to NULL, parts are not deleted
- User navigates to /garage/[id]/edit for an item they don't own → 404 or redirect
- Metadata editor: empty key or value → not saved (trimmed/filtered before insert)
- Weight entered as kg → converted to grams before storing (based on profile's weight_unit)

## Technical Requirements
- Security: `user_id` is taken from the server session, never from the client form
- Storage paths prefixed with `{userId}/` — Storage RLS policies enforce this
- Performance: item list query uses `.limit()` and category index

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
**Designed: 2026-04-30**

### A) Component Structure

```
/garage (Server Page — dynamic, reads ?category and ?bikeId from searchParams)
+-- GarageHeader
|   +-- Title "Deine Garage", item count, active filter label
|   +-- Link: "Neues Item" → /garage/new
+-- BikeSelector (client — renders bike tabs, sets ?bikeId= via router.push)
+-- [if ?bikeId= is set and bike belongs to user]
|   +-- BuildView (lists bike + all Parts with parent_id = bikeId)
+-- [otherwise: list mode]
    +-- CategoryFilter (link pills → ?category=Bike/Part/Gear/Clothing, count badges)
    +-- EmptyState (if visible item list is empty)
    +-- GroupedByCategory (if no category filter active)
    |   +-- CategorySection (per category)
    |       +-- ItemCard[] (sorted: Parts with parent first)
    +-- CategoryGrid (if category filter active)
        +-- ItemCard[]

ItemCard (client — "Mehr anzeigen" toggle for metadata overflow)
+-- Optional image with petrol overlay
+-- Category icon + brand + model
+-- Visibility badge (Eye / EyeOff)
+-- "Verbaut an: {Bike}" badge (link → /garage?bikeId=)
+-- Weight + metadata key/value pairs (first 3, expandable)
+-- Link: "Bearbeiten" → /garage/[id]/edit

/garage/new (Server Page)
+-- Heading + back link to /garage
+-- ItemForm (client, create mode)

/garage/[id]/edit (Server Page — fetches item; returns 404 if not found or wrong user)
+-- Heading + back link to /garage
+-- ItemForm (client, edit mode, pre-filled)
+-- DeleteItemForm (separate form — uses window.confirm before submit)

ItemForm (shared client component, create + edit mode via props)
+-- CategorySelect (native <select>, with tooltip hints per category)
+-- ParentSelect (only shown when category = "Part"; lists user's Bikes)
+-- shadcn Input: brand (required, max 80 chars)
+-- shadcn Input: model (required, max 120 chars)
+-- ImageUploader (client)
|   +-- 16:10 preview area (object-fit cover, petrol overlay)
|   +-- "Bild auswählen / ersetzen" file input (accept JPEG/PNG/WebP/AVIF)
|   +-- "Entfernen" button (sets hidden remove_image="on")
|   +-- Client-side 5 MB guard (error shown before upload attempted)
+-- WeightField (client)
|   +-- Text input (name="weight_g")
|   +-- g/kg toggle (radiogroup, recalculates displayed value on switch)
|   +-- Hidden input name="weight_unit" synced to active unit
+-- MetadataEditor (client)
|   +-- Dynamic key/value row list (name="meta_key" / name="meta_value" arrays)
|   +-- "Attribut hinzufügen" button
|   +-- Row-level delete buttons
+-- shadcn Switch: is_public (hidden input synced, same pattern as Onboarding)
+-- Alert: general error (e.g. session expired, storage failure)
+-- Button: "Item anlegen" / "Änderungen speichern" (disabled while pending)
```

### B) Data Model

No new migrations required — the `items` table and `item-images` Storage bucket are fully implemented in existing migrations (0001–0003).

```
Table: items (existing)
- id          UUID   PK (auto-generated)
- user_id     UUID   FK → profiles.id (ON DELETE CASCADE)
- category    ENUM   'Bike' | 'Part' | 'Gear' | 'Clothing'
- brand       TEXT   NOT NULL (max 80 chars)
- model       TEXT   NULL     (max 120 chars)
- weight_g    INT    NULL, ≥ 0 — always stored in grams
- is_public   BOOL   DEFAULT false
- metadata    JSONB  DEFAULT {} — key/value pairs (max 25 entries)
- image_url   TEXT   NULL — public URL in item-images bucket
- parent_id   UUID   NULL, FK → items.id (ON DELETE SET NULL)
             Only used for category = 'Part'. Gear/Clothing/Bike: always NULL.
- created_at  TIMESTAMPTZ
- updated_at  TIMESTAMPTZ (auto-updated by trigger)

Storage: item-images bucket
- Path pattern: {userId}/{timestamp}-{random}.{ext}
- Allowed MIME: image/jpeg, image/png, image/webp, image/avif, max 5 MB
- Storage RLS: users can only upload/delete under their own userId prefix

Security (RLS):
- SELECT: owner OR (is_public = true AND profiles.is_public = true)
- INSERT: user_id = auth.uid() only
- UPDATE: user_id = auth.uid() only
- DELETE: user_id = auth.uid() only
```

### C) API & Tech Strategy

**New shared lib files** (reused across PROJ-3 and PROJ-5):

| File | Purpose |
|------|---------|
| `src/lib/items/categories.ts` | `ITEM_CATEGORIES` array, `CATEGORY_CONFIG` (labels, icons, empty hints), `isItemCategory()` type guard |
| `src/lib/items/validation.ts` | `parseItemInput(formData)` — validates all fields; custom parser for metadata arrays (Zod doesn't handle `formData.getAll()` natively); `CATEGORIES_WITH_PARENT` constant |
| `src/lib/utils/weight.ts` | `parseToGrams()`, `gramsToInputValue()`, `formatWeight()` — pure functions, fully unit-testable |

**Server Actions** in `src/app/garage/actions.ts`:

| Action | Behaviour |
|--------|-----------|
| `createItemAction` | Parse+validate → optional image upload → INSERT with `user_id = session.user.id` → rollback image if DB fails → redirect /garage |
| `updateItemAction(id)` | Parse+validate → load existing image_url → handle new/remove image → UPDATE with `.eq("user_id", user.id)` defense-in-depth → cleanup replaced image → redirect /garage |
| `deleteItemAction` | Load image_url → DELETE with `.eq("user_id", user.id)` → cleanup Storage image → redirect /garage |

**Validation strategy**: Custom `parseItemInput()` function (not plain Zod), because the metadata field requires `formData.getAll("meta_key")` array processing that Zod schemas cannot express directly. Standard fields (brand, model, weight) are validated with explicit checks that match Zod-equivalent rules.

**Category filter strategy**: URL-based query params (`?category=Bike`). The Server Page reads `searchParams`, filters server-side, and passes counts to `CategoryFilter`. No client state — filter changes are full navigations, cached by Next.js router. This avoids hydration overhead for a read-mostly list.

**Image rollback**: If `storage.upload()` succeeds but `items.insert()` fails, the action calls `storage.remove([path])` to prevent orphaned files in the bucket. The cleanup is best-effort (not transactional) — a failed cleanup leaves an orphaned file but does not expose any data.

**Edit page 404 guard**: The edit page fetches the item with `.eq("id", id).eq("user_id", session.user.id).maybeSingle()`. If the result is `null` (not found, or wrong owner), the page calls Next.js `notFound()`. This means a user can never edit items they don't own — even if they guess a valid UUID.

**Weight**: Always stored as integer grams. The client-side toggle converts the displayed value on unit switch (e.g. "7.45 kg" ↔ "7450 g"). The hidden `weight_unit` field tells the Server Action how to interpret the numeric input before converting to grams.

### D) Dependencies

No new packages required. All shadcn/ui components (Input, Label, Switch, Button, Select) and Lucide icons (Bike, Cog, Backpack, Shirt, ImagePlus, Trash2, Plus, Save, etc.) are already installed.

## Implementation Notes (Backend — 2026-04-30)

### Files Created
| File | Purpose |
|------|---------|
| `src/lib/utils/weight.ts` | `formatWeight()`, `parseToGrams()`, `gramsToInputValue()` — pure weight utility functions |
| `src/lib/utils/weight.test.ts` | 20 unit tests (formatWeight, parseToGrams g/kg, gramsToInputValue) |
| `src/lib/items/categories.ts` | `ITEM_CATEGORIES`, `CATEGORY_CONFIG`, `isItemCategory()` type guard |
| `src/lib/items/validation.ts` | `parseItemInput()`, `parseMetadata()`, `CATEGORIES_WITH_PARENT`, `ItemInput`, `ItemValidationResult` types |
| `src/lib/items/validation.test.ts` | 77 unit tests (parseMetadata 11, parseItemInput 66) |
| `src/app/garage/schema.ts` | `ItemFormState` type |
| `src/app/garage/actions.ts` | `createItemAction`, `updateItemAction`, `deleteItemAction` Server Actions with image upload/rollback |

### Implementation Decisions
- **`Record<string, unknown>` removed from updatePayload**: TypeScript build failed because Supabase's typed `.update()` rejects untyped record. Fixed by building base payload with correct types and conditionally spreading `image_url` with a ternary.
- **Custom validation (not Zod)**: Metadata requires `formData.getAll()` array processing; Zod schemas can't express this natively. `parseItemInput` implements equivalent rules explicitly.
- **Image rollback**: Storage upload success + DB failure → `storage.remove([path])` called as cleanup. Best-effort, not transactional.
- **Edit page defense-in-depth**: `.update().eq("id", id).eq("user_id", user.id)` — second `.eq` ensures users can never accidentally update items belonging to others, even if the 404 guard somehow fails.

### Test Results
- 97 unit tests passing (4 test files)
- `npm run build` clean — no TypeScript errors

## Implementation Notes (Frontend — 2026-04-30)

### Files Created
| File | Purpose |
|------|---------|
| `src/types/supabase.ts` | Added `BikeOption` type export |
| `src/lib/items/build.ts` | `computeBuild()`, `BuildSummary` — pure build aggregation logic |
| `src/components/BottomNav.tsx` | Client bottom navigation (Dashboard, Garage, Explore, Profil) |
| `src/components/items/WeightField.tsx` | g/kg toggle input with unit conversion on switch |
| `src/components/items/MetadataEditor.tsx` | Dynamic key/value row editor, `name="meta_key"` arrays |
| `src/components/items/ImageUploader.tsx` | File picker with preview, 5 MB client guard, remove flag |
| `src/components/items/CategoryFilter.tsx` | Pill links with `?category=` query params and count badges |
| `src/components/items/BikeSelector.tsx` | Horizontal bike pill tabs for build-mode via `?bikeId=` |
| `src/components/items/ItemCard.tsx` | Card with image, category icon, metadata collapse toggle |
| `src/components/items/EmptyState.tsx` | Cockpit empty state (filtered vs. fresh garage) |
| `src/components/items/BuildView.tsx` | Build-focus view: bike header card + stats + parts list |
| `src/components/items/ItemForm.tsx` | Shared create/edit form with `useActionState`; includes `DeleteItemForm` |
| `src/app/garage/layout.tsx` | Authenticated shell: sticky header + BottomNav |
| `src/app/garage/page.tsx` | Garage list — category filter, build-mode, grouped/flat views |
| `src/app/garage/new/page.tsx` | New item page |
| `src/app/garage/[id]/edit/page.tsx` | Edit item page with 404 guard (`.eq("user_id", user.id)`) |

### Key Decisions
- **No custom Button/Input components**: Used raw Tailwind with cockpit classes to avoid shadcn reconfiguration overhead. `FieldInput` wrapper in `ItemForm.tsx` composes an `<input>` with label and error — not a shadcn recreation.
- **`BikeOption` added to `src/types/supabase.ts`**: Slim type for bike dropdown data, kept alongside other DB types.
- **Garage layout**: Added as `src/app/garage/layout.tsx` (not the root layout) so login/onboarding stay unaffected.
- **`metadata` cast**: `item.metadata` comes from Supabase as `Json` type; components cast it to `Record<string, unknown>` locally since JSONB schema guarantees object shape.

### Build Verification
- `npm run build` — clean, no TypeScript errors
- All 97 unit tests still passing

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
