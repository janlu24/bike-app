---
paths:
  - "src/app/api/**"
  - "src/lib/supabase*"
  - "supabase/**"
---

# Backend Development Rules

## Database (Supabase)
- ALWAYS enable Row Level Security on every table
- Create RLS policies for SELECT, INSERT, UPDATE, DELETE
- Add indexes on columns used in WHERE, ORDER BY, and JOIN clauses
- Use GIN indexes for columns intended for text search.
- Use foreign keys with ON DELETE CASCADE where appropriate
- Use snake_case for database tables and columns. Use camelCase for TypeScript variables and API response objects.
- Never skip RLS - security first

## API Routes
- Validate all inputs using Zod schemas before processing
- Always check authentication: verify user session exists
- Map errors to specific status codes: 400 for Zod validation failure, 401 for missing auth, 403 for RLS/permission issues, and 404 for missing resources.
- Use `.limit()` on all list queries
- Always implement pagination for list queries to prevent performance degradation with large datasets.

## Query Patterns
- Use Supabase joins instead of N+1 query loops
- Use `unstable_cache` from Next.js for rarely-changing data
- Check the error object returned by Supabase queries immediately and log it before returning a response and ensure no sensitive database internals are leaked in the public API response.
- Never use .select('*') for production queries. Explicitly list only the required columns to reduce payload size.
- For performance optimization, refer to docs/production/database-optimization.md.

## Security
- Never hardcode secrets in source code
- Use environment variables for all credentials
- Validate and sanitize all user input
- Use parameterized queries (Supabase handles this)
- Strictly sanitize any user input used in Raw SQL queries to prevent SQL injection (though Supabase/PostgREST handles most cases automatically).

## Type Safety
- Use generated types from Supabase CLI for all database interactions.
- Ensure Zod schemas stay in sync with database definitions.
- Avoid using `any` for database results; use the generated `Tables<"table_name">` types.
- All types must be generated into the root directory src/types/supabase.ts
