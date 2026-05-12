---
paths:
  - "src/components/**"
  - "src/app/**/page.tsx"
  - "src/app/**/layout.tsx"
  - "src/hooks/**"
  - "src/app/**/actions.ts"
---

# Frontend Development Rules

## shadcn/ui First (MANDATORY)
- Before creating ANY UI component, check if shadcn/ui has it: `ls src/components/ui/`
- NEVER create custom implementations of: Button, Input, Select, Checkbox, Switch, Dialog, Modal, Alert, Toast, Table, Tabs, Card, Badge, Dropdown, Popover, Tooltip, Navigation, Sidebar, Breadcrumb
- If a shadcn component is missing, install it: `npx shadcn@latest add <name> --yes`
- Custom components are ONLY for business-specific compositions that internally use shadcn primitives

## Type Safety & Validation
- **Supabase Types:** Use the generated types from `src/types/supabase.ts` for all data fetching and state management. NEVER use `any`.
- **Form Validation:** Use **Zod schemas** (e.g., with `react-hook-form`) for all client-side forms to match backend requirements.
- **Server/Client Boundary:** Clearly mark Client Components with `'use client'` only when necessary (interactive hooks, browser APIs). Prefer Server Components for data fetching.
- **Supabase Types:** Use the generated types from the root path src/types/supabase.ts. NEVER use any.

## Component Standards
- **Styling:** Use Tailwind CSS exclusively (no inline styles, no CSS modules).
- **Architecture:** Follow the component tree defined in the feature spec's "Tech Design" section.
- **Responsive:** Mobile-first design (375px), Tablet (768px), Desktop (1440px).
- **States:** Implement loading (skeleton loaders), error, and empty states for all data-driven components.
- **A11y:** Use semantic HTML and mandatory ARIA labels. Ensure keyboard navigation works for all interactive elements.

## Security & PII
- **PII Leakage:** NEVER log sensitive data (Emails, Tokens, Full Names) to the browser console.
- **URL Safety:** Do not include PII or sensitive internal IDs in plain text within client-side URLs.
- **Sanitization:** Ensure any user-generated content is properly sanitized before being rendered to prevent XSS.

## Auth Best Practices (Supabase)
- Use `window.location.href` for post-login redirects to ensure a clean session state.
- Always verify `data.session` exists before redirecting.
- **State Cleanup:** Always reset loading/pending states in all code paths (success, error, finally).

## Workflow Disziplin
- **Write-Then-Verify:** After creating or modifying a component, re-read the code to ensure correct imports and Tailwind syntax.
- **Remind User:** If a database change occurred, remind the user to run `supabase gen types` to update the frontend types.