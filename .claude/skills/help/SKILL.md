---
name: help
description: Context-aware guide that tells you where you are in the workflow and what to do next. Use anytime you're unsure.
argument-hint: "optional question"
user-invocable: true
---

# Project Help Guide

You are a helpful project assistant. Your job is to analyze the current project state and tell the user exactly where they are and what to do next.

## Workflow Intelligence

### Step 1: Analyze Current State
Read these files to understand the project's pulse:
1. **PRD:** Check `docs/PRD.md` (Filled or Template?).
2. **Feature Index:** Read `features/INDEX.md` to see the roadmap and statuses.
3. **Feature Specs:** Scan `/features/PROJ-X-*.md` for specific sections:
   - **Tech Design:** Added by `/architecture`.
   - **Implementation Notes:** Added by `/backend` or `/frontend`.
   - **QA Test Results:** Added by `/qa`.
   - **Deployment:** Added by `/deploy`.
4. **Environment:** Check for root `supabase/migrations/` and `src/types/supabase.ts` to see if the new framework is synced.
5. **Legacy Context:** Check if the feature logic currently exists in `src/alt_bike software/` to guide migration.

### Step 2: Determine Next Action (Logic)

**If PRD is empty:**
> Run `/requirements` to initialize your project description.

**If Features are "Planned" (No Tech Design):**
> Run `/architecture` for `features/PROJ-X-*.md` to create the technical blueprint.

**If feature is 'Planned' but exists in legacy code:**
> Feature PROJ-X logic was detected in `src/alt_bike software/`. Run `/architecture` to start the migration to the new framework.

**If "Architected" but no Implementation:**
> **Check Backend Need:** If the design requires DB changes, run `/backend` first to generate types.
> **UI Only:** Run `/frontend` to build the components.

**If "In Progress" (Partially built):**
> Check if backend types are generated (`src/types/supabase.ts`).
> If Backend is done, run `/frontend` to complete the UI.

**If "In Review" (Implementation done):**
> Run `/qa` to perform the security audit and test acceptance criteria.

**If "Approved" (Passed QA):**
> Run `/deploy` to push to production and sync Supabase migrations.

## Step 3: Available Commands Reference
- `/requirements`: Create/update project and feature specs.
- `/architecture`: Technical design, RLS rules, and component tree.
- `/backend`: DB migrations, RLS policies, Zod validation, and API logic.
- `/frontend`: Responsive UI, shadcn/ui components, and Type-Safe integration.
- `/qa`: Manual/E2E testing, A11y check, and Red-Team security audit.
- `/deploy`: Production build, Vercel deployment, and DB sync.

## Output Format
Always respond with this structure:

### 📍 Current Project Status
_Summary of the overall progress_.

### 📋 Feature Roadmap
_Table: ID | Feature | Status | Next Step_.

### 🚀 Recommended Next Step
_The single most important command to run right now_.

### 💡 Pro-Tip
_Mention a rule from `.claude/rules/` like "Write-Then-Verify" or "Security-First"_.

### Important: Root Awareness
- Strict Isolation: All help guidance, file paths, and command suggestions MUST refer strictly to the root directory (e.g., src/app/, src/components/, supabase/migrations/).  
- Legacy Reference: Never suggest implementing or modifying code within src/alt_bike software/. That directory is for READ-ONLY reference during migration.  
- Status Integrity: Always verify the features/INDEX.md status before recommending the next command.

## Git Commit
```
docs(help): Update help guide workflow logic
```
