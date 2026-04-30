# PROJ-7: Explore / Community Feed

## Status: Planned
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

## Dependencies
- Requires: PROJ-3 (Item Management) — public items data
- Requires: PROJ-6 (User Profile Page) — public profiles, /profile/[username] routes

## User Stories
- As a user, I want to browse public setups from other cyclists so that I can get inspiration for my own builds
- As a visitor (unauthenticated), I want to browse the Explore feed without creating an account so that I can discover the app's value before registering
- As a user, I want to filter the Explore feed by category (Bike, Part, Gear, Clothing) so that I see only what's relevant to me
- As a user, I want to click on an item in the feed and see the owner's full public profile so that I can explore their complete setup

## Acceptance Criteria
- [ ] /explore shows a paginated feed of public items (is_public=true) from public profiles (is_public=true)
- [ ] Feed is accessible without login (unauthenticated users can browse)
- [ ] Each item card shows: image (if available), brand, model, category icon, owner username
- [ ] Clicking an item card navigates to /profile/[username]
- [ ] Category filter on /explore filters the feed to a single category
- [ ] Pagination: "Mehr laden" button or infinite scroll (load more pattern, not full page reload)
- [ ] Empty state when no public items exist — with CTA to register and share own setup
- [ ] RLS enforced server-side: only items where both `items.is_public = true` AND `profiles.is_public = true` appear

## Edge Cases
- Item's profile goes private after appearing in feed → no longer shown on next load
- Item's own is_public set to false → removed from feed on next load
- All public items are one category → other category filters show empty state
- Unauthenticated user clicks on a profile link and then tries to navigate to /garage → redirect to /login
- Feed has no items at all (fresh app launch) → empty state with registration CTA
- User's own public items appear in Explore — that is intentional and correct

## Technical Requirements
- Performance: Explore query must JOIN items + profiles in a single Supabase query (no N+1)
- Query must use `.limit()` for pagination and `items_is_public_idx` + `profiles_is_public_idx` indexes
- Page should be statically or ISR-cached where possible (public data, no auth required)
- Security: Server-side RLS is the enforcement layer — no client-side filtering of private data

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
