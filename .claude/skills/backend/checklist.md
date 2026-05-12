# Backend Implementation Checklist

## Core Implementation
- [ ] **Migrations First:** No manual SQL editor changes; all changes are in `supabase/migrations/`.
- [ ] **RLS Mandatory:** Row Level Security enabled on ALL new or modified tables.
- [ ] **Policy Coverage:** Explicit RLS policies created for SELECT, INSERT, UPDATE, and DELETE.
- [ ] **Data Integrity:** Foreign keys set with `ON DELETE CASCADE` or appropriate behavior.
- [ ] **Validation:** Zod schemas implemented for all POST/PUT/PATCH request bodies.
- [ ] **Auth Check:** User session verified via Supabase Auth before any data processing.
- [ ] **Type-Safety:** `supabase gen types` executed and generated types used in API/Server Actions.
- [ ] **Error Handling:** Meaningful error messages returned with correct HTTP status codes (400, 401, 403, 404, 500).
- [ ] **Legacy Logic:** Reviewed src/alt_bike software/ for existing business logic and edge cases to ensure full migration.
- [ ] **Root Migrations:** Verified that ALL new migrations are located in the root supabase/migrations/ (not in legacy subfolders).
- [ ] **Type-Safety:** supabase gen types executed; verified that src/types/supabase.ts (Root) was updated and used.  
- [ ] **Naming:** Used snake_case for database entities and camelCase for TypeScript/API variables.

## Verification & Security
- [ ] **RLS Testing:** Verified RLS policies manually using `curl` or integration tests (checking restricted access).
- [ ] **PII Protection:** Confirmed that no sensitive data (PII) is leaked in logs or API responses.
- [ ] **No Secrets:** Verified that no API keys or database secrets are hardcoded in the source code.
- [ ] **Acceptance Criteria:** All ACs from the feature spec are fully addressed by the implementation.
- [ ] **Build Check:** `npm run build` or `next build` passes without TypeScript or linting errors.
- [ ] **PII Protection:** Confirmed no sensitive data (Emails, Tokens) is logged to the console or leaked in public API responses.
- [ ] **Security:** Verified that no 'service_role' keys are used in client-side or standard API logic to bypass RLS.

## Performance & Optimization
- [ ] **Indexing:** Indexes created on all columns used in WHERE, JOIN, or ORDER BY clauses.
- [ ] **Query Efficiency:** No N+1 query loops; utilized Supabase joins or `.select('*, other_table(*)')`.
- [ ] **Pagination:** All list queries implement `.limit()` and support pagination.
- [ ] **Caching:** Utilized Next.js `unstable_cache` or similar for rarely changing data.

## Process & Tracking (General Rules)
- [ ] **Implementation Notes:** Detailed notes added to the feature spec documenting what was built.
- [ ] **Status Updated:** `features/INDEX.md` and feature spec header updated to "In Review".
- [ ] **Git:** Changes committed with format `feat(PROJ-X): description`.
- [ ] **Status Updated:** features/INDEX.md and feature spec header updated correctly:  
    - Set to 'In Review' if both Backend and Frontend are complete.  
    - Set to 'In Progress' if Frontend implementation is still pending.