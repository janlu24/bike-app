---
paths:
  - "src/app/api/**"
  - ".env*"
  - "supabase/**"
  - "next.config.*"
  - "src/middleware.ts"
---

# Security Rules

## Secrets Management
- NEVER commit secrets, API keys, or credentials to git
- Use `.env.local` for local development (already in .gitignore)
- Use `NEXT_PUBLIC_` prefix ONLY for values safe to expose in browser
- Document all required env vars in `.env.local.example` with dummy values

## Input Validation
- Validate ALL user input on the server side with Zod
- Never trust client-side validation alone
- Sanitize data before database insertion
- NEVER log Personally Identifiable Information (PII) like emails or tokens to the console.

## Authentication
- Always verify authentication before processing API requests
- Use Supabase RLS as a second line of defense
- Implement rate limiting on authentication endpoints
- Ensure CORS policies are restricted to authorized domains only.
- For rate limiting details, see docs/production/rate-limiting.md.

## Security Headers
- Implement the following headers in `next.config.js` or `middleware.ts`:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: origin-when-cross-origin
  - Strict-Transport-Security with includeSubDomains
  - Follow implementation details in docs/production/security-headers.md.

## Code Review Triggers
- Any changes to RLS policies require explicit user approval
- Any changes to authentication flow require explicit user approval
- Any new environment variables must be documented in .env.local.example
- Stop and ask the user before installing new npm packages to review security implications.
