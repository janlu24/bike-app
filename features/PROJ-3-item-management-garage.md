# PROJ-3: Item Management / Garage

## Status: In Progress
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
