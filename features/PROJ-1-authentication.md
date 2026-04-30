# PROJ-1: Authentication

## Status: In Progress
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

## Dependencies
- None

## User Stories
- As an unregistered user, I want to create an account with email and password so that I can manage my equipment privately
- As a returning user, I want to log in so that I can access my personal data and setups
- As a logged-in user, I want to log out so that my account is secure on shared devices
- As an unauthenticated user, I want to be redirected to /login when accessing protected pages so that my data stays private
- As a user who registered via email, I want my auth callback handled correctly so that my session is established after email confirmation

## Acceptance Criteria
- [ ] Email/password registration via Supabase Auth works
- [ ] Email/password login works, session is established
- [ ] Sign-out clears the session and redirects to /login
- [ ] Middleware protects all routes except /login, /auth/callback, /auth/signout and /explore
- [ ] Auth callback at /auth/callback exchanges the code and redirects to dashboard or onboarding
- [ ] Auth-related error messages are shown in German
- [ ] Login form has client-side Zod validation before submission

## Edge Cases
- Invalid credentials → German error message, no session established
- Email not yet confirmed → appropriate German message shown
- Session expired → automatic redirect to /login on next protected route visit
- User who is already logged in visits /login → redirect to dashboard
- Auth callback receives an error code → redirect to /login with error param

## Technical Requirements
- Security: All auth state must come from `supabase.auth.getUser()` server-side, never from client-only state
- Middleware runs on Edge Runtime (Next.js middleware.ts)
- No secrets in client bundle

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
