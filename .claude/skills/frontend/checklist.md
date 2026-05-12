# Frontend Implementation Checklist

## UI Standards & shadcn/ui
- [ ] **shadcn First:** Checked `src/components/ui/` for EVERY component needed.
- [ ] **No Duplicates:** No custom versions of primitives (Button, Input, etc.) created.
- [ ] **Composition:** Custom components are composed of shadcn primitives.
- [ ] **Tailwind Only:** No inline styles or CSS modules used.

## Type Safety & Data
- [ ] **Supabase Types:** Used generated types strictly from the root `src/types/supabase.ts` (Zero any policy).
- [ ] **Validation:** Zod schemas implemented for all client-side forms to match backend.
- [ ] **States:** Loading (skeletons), Error (user-friendly), and Empty states implemented.

## Security & Privacy (PII)
- [ ] **No PII Leaks:** Verified no sensitive data (Emails, Tokens) is logged to console.
- [ ] **URL Safety:** No PII or sensitive internal IDs exposed in client-side URLs.
- [ ] **XSS Protection:** All user-generated content is properly sanitized/escaped.

## Quality & Accessibility
- [ ] **Responsive:** Verified on Mobile (375px), Tablet (768px), and Desktop (1440px).
- [ ] **A11y:** Semantic HTML used, ARIA labels present, and keyboard navigation works.
- [ ] **Build:** `npm run build` passes without TypeScript or Linting errors.

## Process & Verification (Write-Then-Verify)
- [ ] **Implementation Notes:** Added notes to the feature spec documenting component structure.
- [ ] **Verify Edits:** Re-read modified files to ensure syntax and imports are correct.
- [ ] **Status:** `features/INDEX.md` status updated to 'In Review' (if backend is ready) or 'In Progress'.
- [ ] **Git:** Committed with `feat(PROJ-X): description`.

## Legacy Reference
- [ ] **Legacy Isolation:** Verified that no code was written to src/alt_bike software/.
- [ ] **Logic Migration:** Existing logic from legacy components was correctly adapted to the new architecture.