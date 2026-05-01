# PROJ-6: User Profile Page

## Status: In Progress
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
- [ ] /profile shows the own profile page with edit capability for: full_name, bio, avatar_url, is_public, weight_unit
- [ ] Username is displayed but NOT editable (shown as read-only with a note)
- [ ] Avatar upload: max 5 MB, JPEG/PNG/WebP/AVIF, stored in Supabase Storage bucket `avatars`
- [ ] weight_unit toggle (g / kg) persists to profile and affects all weight displays app-wide
- [ ] is_public toggle controls whether the profile and its public items appear in Explore
- [ ] /profile/[username] shows the public profile of another user with their public items listed
- [ ] /profile/[username] returns 404 if profile does not exist or `is_public = false`
- [ ] Own profile is always visible at /profile regardless of is_public setting
- [ ] Profile update uses a Zod-validated Server Action
- [ ] RLS: profile row can only be updated by the owner

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

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
