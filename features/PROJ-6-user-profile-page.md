# PROJ-6: User Profile Page

## Status: Planned
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
