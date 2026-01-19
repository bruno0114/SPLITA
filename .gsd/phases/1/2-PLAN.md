---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Social Auth & UI Polish

## Objective
Implement Google and Facebook authentication and polish the auth UI for production stability.

## Context
- `Onboarding.tsx`
- `Login.tsx`
- `useAuth.ts`

## Tasks

<task type="auto">
  <name>Social Auth Wiring</name>
  <files>src/features/auth/pages/Onboarding.tsx, src/features/auth/pages/Login.tsx</files>
  <action>
    - Connect Google and Facebook buttons to `signInWithOAuth` from the `useAuth` hook.
    - Pass correct `provider` and `redirectTo` options.
    - Ensure the `redirectTo` is dynamically calculated based on environment (local vs prod).
  </action>
  <verify>Click Google button -> Check if it redirects to Google Auth page.</verify>
  <done>Social buttons trigger Supabase OAuth flow.</done>
</task>

<task type="auto">
  <name>Auth UI Error Handling</name>
  <files>src/features/auth/pages/Login.tsx, src/features/auth/pages/Onboarding.tsx</files>
  <action>
    - Add descriptive error mapping for common Supabase errors (e.g., "Invalid login credentials" -> "Email o contraseña incorrectos").
    - Ensure consistent design for error banners.
  </action>
  <verify>Try login with wrong password -> Verify translated error message.</verify>
  <done>User-friendly error messages are displayed.</done>
</task>

## Success Criteria
- [ ] Google/Facebook login buttons are functional.
- [ ] Login/Signup forms have robust validation and error handling.
- [ ] Documentation includes Social Auth setup steps.
