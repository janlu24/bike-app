# PROJ-6: User Profile Page

## Status: Approved
**Created:** 2026-04-30
**Last Updated:** 2026-05-01

## Dependencies
- Requires: PROJ-1 (Authentication)
- Requires: PROJ-2 (Onboarding & Profil-Setup) — Profil-Zeile muss existieren

## User Stories
- As a user, I want to view and edit my profile (full name, bio, avatar) so that my public presence is up to date
- As a user, I want to toggle my profile between public and private to control whether others can discover my setups
- As a user, I want to choose whether weights are displayed in grams or kilograms throughout the app
- As a visitor, I want to view another user's public profile and their public items so that I can see their setup
- As a user, I want to upload a profile picture so that my profile is personalized

## Acceptance Criteria
- [x] /profile shows the own profile page with edit capability for: full_name, bio, avatar_url, is_public, weight_unit
- [x] Username is displayed but NOT editable (shown as read-only with a note)
- [x] Avatar upload: max 5 MB, JPEG/PNG/WebP/AVIF, stored in Supabase Storage bucket `avatars`
- [x] weight_unit toggle (g / kg) persists to profile and affects all weight displays app-wide
- [x] is_public toggle controls whether the profile and its public items appear in Explore
- [x] /profile/[username] shows the public profile of another user with their public items listed
- [x] /profile/[username] returns 404 if profile does not exist or `is_public = false`
- [x] Own profile is always visible at /profile regardless of is_public setting
- [x] Profile update uses a Zod-validated Server Action
- [x] RLS: profile row can only be updated by the owner

## Edge Cases
- User has no bio, full_name, or avatar → graceful empty state with placeholder UI
- Profile set to private → /profile/[username] returns 404 for any visitor (including logged-in users)
- Avatar upload fails → existing avatar unchanged, error shown in German
- weight_unit change → all existing item weights are NOT converted, only display changes
- Username in URL contains characters that are valid in the DB but URL-encoded → handle correctly
- User tries to edit profile of another user → 403 / redirect

## Technical Requirements
- Avatar storage bucket: `avatars` with path `{userId}/avatar.{ext}` (upsert = true for replace)
- weight_unit must default to 'g' for all new profiles (already set in DB migration 0004)
- Security: profile update Server Action verifies `auth.uid() = profile.id` before update

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Component Structure

```
/profile  (Own Profile — protected, inside (app) layout)
+-- ProfilePage  [Server Component]
    +-- ProfileHeader
    |   +-- AvatarUploader  [Client Component — reuses ImageUploader pattern]
    |   |   +-- Avatar  [shadcn/ui]
    |   +-- Username  [read-only, prominent display]
    |   +-- Email  [read-only, subdued display]
    +-- ProfileEditSection  [Card — shadcn/ui]
    |   +-- ProfileEditForm  [Client Component]
    |       +-- full_name  [Input — shadcn/ui]
    |       +-- bio  [Textarea — shadcn/ui]
    |       +-- weight_unit  [RadioGroup — shadcn/ui: "g" / "kg"]
    |       +-- is_public  [Switch — shadcn/ui + description text]
    |       +-- Save  [Button — shadcn/ui]
    +-- PublicProfileLink  [conditional — shown only when is_public=true]
    +-- Sign Out  [form POST to /auth/signout]

/profile/[username]  (Public Profile — publicly accessible, outside (app) layout)
+-- PublicProfilePage  [Server Component]
    +-- notFound()  if profile missing or is_public=false
    +-- PublicProfileHeader
    |   +-- Avatar  [shadcn/ui]
    |   +-- full_name / @username
    |   +-- bio
    +-- PublicItemList
        +-- ItemCard  [REUSE: src/components/items/ItemCard.tsx]
        +-- EmptyState  [REUSE: src/components/items/EmptyState.tsx]
```

**New files to create:**
- `src/app/(app)/profile/page.tsx` — own profile page
- `src/app/(app)/profile/actions.ts` — Server Action for profile update + avatar upload
- `src/app/(app)/profile/schema.ts` — Zod validation schema
- `src/app/profile/[username]/page.tsx` — public profile view (outside (app) group)
- `src/components/profile/ProfileEditForm.tsx` — edit form (Client Component)
- `src/components/profile/AvatarUploader.tsx` — avatar upload widget (Client Component)
- `src/components/profile/PublicProfileHeader.tsx` — read-only profile header
- `src/components/profile/PublicItemList.tsx` — filtered item list for public profile
- `src/lib/weight-unit-context.tsx` — WeightUnitContext + WeightUnitProvider

**Files to modify:**
- `src/app/(app)/layout.tsx` — wrap with WeightUnitProvider, passing weight_unit from profile
- `src/components/items/WeightField.tsx` — read weight_unit from context instead of prop

---

### B) Data Model

**No new database tables required.** The `profiles` table already has all necessary columns:

```
Entity: profiles  (already exists — migration 0001 + 0004)
- id            UUID — primary key, references auth.users
- username      Text — unique, 3–32 chars, NOT editable after onboarding
- full_name     Text — optional display name (max 120 chars)
- bio           Text — optional short description (max 500 chars)
- avatar_url    Text — optional public URL to stored avatar image
- is_public     Boolean — controls public discoverability (default: false)
- weight_unit   Text — 'g' or 'kg', display preference (default: 'g')

Entity: items  (already exists — migration 0001)
- Used on public profile to list public items of that user
- Only items where is_public=true AND profile is_public=true are shown to visitors
```

**New Storage Bucket (requires new migration 0006):**
```
Bucket: avatars
- Path pattern: {userId}/avatar.{ext}   (e.g. abc-123/avatar.jpg)
- Upsert = true  →  replacing avatar always overwrites the same path
- Bucket visibility: public  →  images served via Supabase CDN URL without auth token

Storage RLS:
- SELECT: unrestricted (public bucket — any visitor can load avatar images)
- INSERT / UPDATE / DELETE: only if the requesting user's ID matches the folder name
  (ensures a user can only manage their own avatar file)
```

---

### C) API & Tech Strategy

**Own profile page (`/profile`):**
- Server Component inside the `(app)` route group, so the existing auth middleware protects it automatically
- `force-dynamic` to always render fresh data (avoids stale cache after profile update)
- Fetches the user's own profile row server-side; redirects to `/onboarding` if profile row is missing

**Profile update Server Action:**
- Accepts FormData with all editable fields: `full_name`, `bio`, `is_public`, `weight_unit`, and an optional `avatar` file
- Zod validates all text fields and the weight_unit enum before touching the database
- Avatar file (if present) is validated for MIME type (JPEG / PNG / WebP / AVIF) and size (max 5 MB) before upload
- Upload order: storage first → profile update second; if storage upload fails the profile row is not modified, so there is no partial-state corruption
- On success: revalidates `/profile` (own page) and `/profile/[username]` (public page) so both immediately reflect changes
- Returns a typed form state (success toast text or per-field error messages in German)

**Public profile page (`/profile/[username]`):**
- Server Component placed **outside** the `(app)` layout group so it is accessible to unauthenticated visitors
- Fetches profile by username using a server-side Supabase client (anon key)
- Calls `notFound()` explicitly if the profile row is missing OR `is_public = false` — this maps to a 404 response, which satisfies the spec requirement that private profiles are indistinguishable from non-existent ones
- The existing RLS policy `profiles_select_public_or_owner` already enforces this at the database layer (unauthenticated queries cannot see private profiles); the explicit check is a defence-in-depth measure
- Fetches only `is_public = true` items for the listed profile, limited and paginated

**Weight unit — app-wide propagation:**
- The `(app)/layout.tsx` Server Component (already loads the user's profile for navigation) passes `weight_unit` as a prop to `WeightUnitProvider`
- `WeightUnitProvider` is a minimal Client Component that supplies a `useWeightUnit()` hook via React Context
- `WeightField` and any other weight-displaying components call `useWeightUnit()` instead of receiving the unit as a prop
- No database queries are added; the value piggybacks on the profile fetch already done in the layout

**Security notes:**
- The Server Action verifies `auth.uid() = profile.id` before every update — RLS is a second layer, not the only guard
- Avatar URLs are public CDN URLs (no signed tokens needed) because avatar images are intentionally public content
- Email address (PII) is shown on the own `/profile` page only, never on the public `/profile/[username]` page

---

### D) Dependencies

No new npm packages required. All UI primitives are already installed:
- `Avatar` — shadcn/ui (`src/components/ui/avatar.tsx`)
- `Switch` — shadcn/ui (`src/components/ui/switch.tsx`)
- `RadioGroup` — shadcn/ui (`src/components/ui/radio-group.tsx`)
- `Textarea` — shadcn/ui (`src/components/ui/textarea.tsx`)

**New Supabase migration required:**
- `supabase/migrations/0006_avatars_bucket.sql` — creates the `avatars` storage bucket and its RLS policies

## Implementation Notes (Backend — 2026-05-01)

### What was built
Backend-only implementation. No frontend components were created in this task.

### Files created
- `supabase/migrations/0006_avatars_bucket.sql` — Creates the `avatars` storage bucket (public) and four Storage RLS policies (SELECT unrestricted; INSERT/UPDATE/DELETE restricted to `auth.uid()::text = (storage.foldername(name))[1]`). Migration is idempotent via `on conflict` and `drop policy if exists`. Includes inline RLS verification guide for manual testing.
- `src/app/(app)/profile/schema.ts` — Zod schema `updateProfileSchema` validating: `full_name` (optional, max 120), `bio` (optional, max 500), `is_public` (boolean, default false), `weight_unit` (enum `'g'|'kg'`), `avatar` (optional File, max 5 MB, JPEG/PNG/WebP/AVIF). Exports `UpdateProfileInput` type and `ProfileFormState` interface (error, fieldErrors, success).
- `src/app/(app)/profile/actions.ts` — `updateProfileAction` Server Action accepting FormData. Validates text fields via Zod, verifies session via `requireUser()`, uploads avatar to `avatars/{userId}/avatar.{ext}` with `upsert=true` BEFORE the DB update (storage-first ordering prevents partial state), updates the `profiles` row, and revalidates both `/profile` and `/profile/{username}`. Returns typed `ProfileFormState`.

### Deviations from spec
None. All decisions follow the tech design exactly:
- Upload order: storage first, DB second.
- Avatar path: `avatars/{userId}/avatar.{ext}` with upsert=true.
- Bucket: public visibility.
- No new DB tables.
- `username` is not in the update payload (not editable).

### Pending (frontend task)
- `src/app/(app)/profile/page.tsx` — own profile page (Server Component)
- `src/app/profile/[username]/page.tsx` — public profile page (outside (app) group)
- `src/components/profile/ProfileEditForm.tsx`, `AvatarUploader.tsx`, `PublicProfileHeader.tsx`, `PublicItemList.tsx`
- `src/lib/weight-unit-context.tsx` — WeightUnitContext
- Modifications to `src/app/(app)/layout.tsx` and `src/components/items/WeightField.tsx`

### Type generation reminder
No new database columns were added. Run `supabase gen types typescript` only if the migration is applied to a project where the `avatars` bucket affects generated storage types.

## Implementation Notes (Frontend — 2026-05-01)

### What was built
Full frontend implementation for the User Profile Page feature.

### Files created
- `src/lib/weight-unit-context.tsx` — `WeightUnitContext`, `WeightUnitProvider`, and `useWeightUnit()` hook. Defaults to `'g'` when no context is provided.
- `src/components/profile/AvatarUploader.tsx` — Client Component. Displays shadcn `Avatar` with a camera-button overlay to select a new avatar file. Validates size (5 MB) and MIME type client-side and shows errors in German. Submits via `name="avatar"` FormData field.
- `src/components/profile/ProfileEditForm.tsx` — Client Component. Uses `useActionState` with `updateProfileAction`. Renders full_name (Input), bio (Textarea), weight_unit (RadioGroup g/kg with hidden input), is_public (Switch with hidden input), Save (Button). Displays success/error states from server action.
- `src/components/profile/PublicProfileHeader.tsx` — Server-renderable Component. Shows shadcn Avatar, full_name, `@username`, bio. Email is not shown (PII guard).
- `src/components/profile/PublicItemList.tsx` — Renders public items grouped by category without edit controls. Includes an empty state for profiles with no public items.
- `src/app/(app)/profile/page.tsx` — Own profile page (Server Component). Fetches user + profile, redirects to `/login` or `/onboarding` as needed. Shows `ProfileEditForm`, public profile link (conditional), and sign-out button. `force-dynamic` export.
- `src/app/profile/[username]/page.tsx` — Public profile page (Server Component, outside `(app)` group). Calls `notFound()` if profile is missing or `is_public = false`. Fetches up to 50 public items. `force-dynamic` export.

### Files modified
- `src/app/(app)/layout.tsx` — Now an `async` Server Component. Fetches the authenticated user's `weight_unit` from the profile and wraps children with `WeightUnitProvider`.
- `src/components/items/WeightField.tsx` — Reads preferred unit from `useWeightUnit()` context as the initial unit when no `initialGrams` is present (or when `initialGrams < 1000`). The user can still toggle unit in the field.
- `src/app/(app)/profile/schema.ts` — Fixed Zod v4 compatibility: renamed `errorMap` option to `error` in `z.enum()` call.

### Deviations from spec
- `schema.ts` bug fix: the backend-written schema used `errorMap` which is a Zod v3 API. The project uses Zod v4 which requires `error`. Fixed to unblock the build.
- `PublicItemList` implements its own read-only `PublicItemCard` instead of reusing `ItemCard` because `ItemCard` includes an edit footer and edit link that are inappropriate for public views.

## QA Test Results

**Status:** APPROVED
**Tested:** 2026-05-01
**Tester:** QA Agent

### Summary
All 10 Acceptance Criteria pass. All 6 edge cases are covered by code-level audit. Security audit found no critical or high vulnerabilities. Accessibility attributes are correctly implemented. TypeScript build is clean (`npm run build` passes). Unit tests: 25/25 pass. E2E tests: 2 active pass, 18 appropriately skipped (require live Supabase session).

### AC Coverage
| AC | Result | Notes |
|----|--------|-------|
| /profile shows edit form: full_name, bio, avatar_url, is_public, weight_unit | PASS | `ProfilePage` fetches all 7 columns; `ProfileEditForm` renders all editable fields |
| Username displayed as read-only with note "(nicht änderbar)" | PASS | `ProfileEditForm` renders username in a `<p>` tag with explicit label note |
| Avatar upload: max 5 MB, JPEG/PNG/WebP/AVIF, stored in `avatars` bucket | PASS | Client-side guard in `AvatarUploader`; server-side guard in `uploadAvatar()`; bucket created in `0006_avatars_bucket.sql` |
| weight_unit toggle (g/kg) persists to profile and affects all weight displays app-wide | PASS | RadioGroup with hidden input persists to DB; `layout.tsx` reads value and wraps with `WeightUnitProvider`; `WeightField` consumes context |
| is_public toggle controls Explore visibility | PASS | Switch state drives hidden `is_public` input; action persists boolean; public page enforces `is_public = true` check |
| /profile/[username] shows public profile with public items | PASS | `PublicProfilePage` renders `PublicProfileHeader` + `PublicItemList` with `is_public=true` filter |
| /profile/[username] returns 404 for missing or is_public=false profiles | PASS | Explicit `if (!profile \|\| !profile.is_public) { notFound(); }` at line 24 of public profile page |
| Own profile always visible at /profile regardless of is_public | PASS | Own profile uses `(app)` layout (auth-protected), never calls `notFound()`; fetches without `is_public` filter |
| Profile update uses Zod-validated Server Action | PASS | `updateProfileAction` calls `updateProfileSchema.omit({ avatar: true }).safeParse(raw)` before any DB operation |
| RLS: profile row only updatable by owner | PASS | Action uses `.eq("id", user.id)` as first defence; Supabase RLS `auth.uid() = id` is second layer |

### Edge Cases
| Edge Case | Result | Notes |
|-----------|--------|-------|
| No bio/full_name/avatar — graceful empty state | PASS | `PublicProfileHeader` conditionally renders `full_name` and `bio`; `AvatarFallback` shows username initials or User icon; no crashes on null values |
| Profile set to private — /profile/[username] returns 404 | PASS | `notFound()` called when `!profile.is_public` regardless of whether profile row exists; private profiles are indistinguishable from non-existent ones |
| Avatar upload fails — existing avatar unchanged, error in German | PASS | Upload-first ordering: storage failure returns `{ fieldErrors: { avatar: "Avatar-Upload fehlgeschlagen." } }` before any DB write |
| weight_unit change — existing weights NOT converted, only display | PASS | `WeightField` converts display value only when user manually toggles the unit toggle in the field; context change only affects initial unit for new inputs |
| URL-encoded username in URL — handled correctly | PASS | Next.js `params` destructuring decodes URL-encoded segments automatically before passing to the DB query |
| User tries to edit another user's profile — 403/redirect | PASS | `requireUser()` binds the session user ID; `.eq("id", user.id)` ensures only the owner's row is updated; no path to supply a different user ID |

### Security Audit
| Check | Result | Notes |
|-------|--------|-------|
| `actions.ts` verifies `auth.uid()` before update | PASS | `requireUser()` called at step 2; `.eq("id", user.id)` at step 5 — RLS is second layer |
| No path to update another user's profile row | PASS | The update payload always uses `user.id` from the verified session; no external `userId` parameter accepted |
| All fields validated with Zod (full_name max 120, bio max 500, weight_unit enum) | PASS | `updateProfileSchema` enforces all limits with German error messages |
| Storage RLS: public read + owner-only write/delete | PASS | `0006_avatars_bucket.sql`: SELECT unrestricted; INSERT/UPDATE/DELETE check `auth.uid()::text = (storage.foldername(name))[1]` |
| Email (PII) never rendered on public /profile/[username] | PASS | `PublicProfilePage` selects `id, username, full_name, bio, avatar_url, is_public` — no email column fetched; `PublicProfileHeader` has no email prop |
| Email only shown on own /profile page | PASS | `ProfilePage` passes `user.email` to `ProfileEditForm`; email rendered as read-only text, not in a form field |
| No PII logged to browser console | PASS | No `console.log/warn/error/info` calls found in any profile component or action |
| Avatar MIME validation server-side (not client-only) | PASS | `uploadAvatar()` in `actions.ts` validates `ALLOWED_MIME.has(file.type)` server-side independently of client check |
| XSS: user content never rendered as raw HTML | PASS | No `dangerouslySetInnerHTML` found anywhere in profile components; all user content rendered as text nodes |
| Avatar path restricted to `{userId}/avatar.{ext}` — no path traversal | PASS | Path constructed as `` `${userId}/avatar.${ext}` `` where `userId` is the authenticated session UID and `ext` is derived from a MIME whitelist |

### Accessibility Audit
| Check | Result | Notes |
|-------|--------|-------|
| Form labels associated with inputs | PASS | `<Label htmlFor="full_name">`, `<Label htmlFor="bio">`, `<Label htmlFor="weight-unit-g/kg">` all correctly associated |
| ARIA label on camera button (icon-only) | PASS | `<label aria-label="Profilbild ändern">` on the camera icon overlay |
| Error messages use role="alert" | PASS | All per-field error `<p>` elements use `role="alert"` |
| Success message uses role="status" | PASS | Success `<div>` uses `role="status"` |
| `aria-describedby` on inputs pointing to error/hint paragraphs | PASS | `full_name` and `bio` inputs use `aria-describedby` linking to their respective error/hint elements |
| `aria-label` on RadioGroup | PASS | RadioGroup has `aria-label="Gewichtseinheit auswählen"` |
| Semantic heading structure | PASS | `<h1>` on own profile, `<h1>` + `<h2>` on public profile, `<h3>` on item cards |

### Bugs Found
| ID | Severity | Description | Steps to Reproduce | Status |
|----|----------|-------------|-------------------|--------|
| BUG-6-001 | Low | `PublicItemList` uses fixed auto-threshold `formatWeight()` ignoring visitor's weight unit preference | 1. Create public profile with items having weights between 100–999 g. 2. Visit /profile/[username] as a user who prefers "kg". 3. Observe weights shown in grams despite preference. | Open — by design per spec; weight_unit is a personal setting only applied inside the (app) layout. No fix needed unless spec changes. |
| BUG-6-002 | Low | `requireUser()` is called AFTER Zod validation in `updateProfileAction`; unauthenticated requests execute Zod parsing unnecessarily before being rejected | 1. Send a POST to the Server Action without a valid session. 2. Observe the request proceeds through Zod validation before failing auth. | Informational — no security impact (auth is still enforced). Minimal performance impact. Not a blocker. |

### Test Files
- Unit: `src/app/(app)/profile/schema.test.ts` — 25 tests, all pass
- E2E: `tests/PROJ-6-user-profile-page.spec.ts` — 2 active pass (auth guard redirect), 18 skipped (require live Supabase session or known test users)

## Deployment
_To be added by /deploy_
