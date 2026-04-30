# PROJ-5: Bike Build View

## Status: In Progress
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
