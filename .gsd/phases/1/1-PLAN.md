---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Functional Onboarding Persistence

## Objective
Enable complete data capture during the 6-step onboarding flow and persist it to Supabase after the user creates their account.

## Context
- `Onboarding.tsx`
- `useAuth.ts`
- `useGroups.ts`
- `.gsd/phases/1/RESEARCH.md`

## Tasks

<task type="auto">
  <name>Onboarding State Management</name>
  <files>src/features/auth/pages/Onboarding.tsx</files>
  <action>
    - Initialize a `formData` object to collect: usageType, groupName, groupMembers (emails), and settings (toggles).
    - Update each Step component to receive and update this state:
      - Step 2: Set `usageType`.
      - Step 3: Set `groupName`.
      - Step 4: Add/Remove from `groupMembers` list.
      - Step 5: Update `settings` object.
  </action>
  <verify>Check state updates in React DevTools (conceptually) or add loggers.</verify>
  <done>All 6 steps update the central formData object correctly.</done>
</task>

<task type="auto">
  <name>Persistence Implementation</name>
  <files>src/features/auth/pages/Onboarding.tsx</files>
  <action>
    - Modify `handleSignUp` in `StepCreateAccount` (Step 6) to perform the following after successful auth:
      1. Update user profile/metadata with `usageType`.
      2. If `groupName` is set, create a new Group in Supabase.
      3. Add the current user as the owner of the group.
      4. (Optional MVP) Store invited emails as pending in a groups_invites table or similar.
      5. Store settings in user metadata.
    - Ensure loading states cover the entire persistence process.
  </action>
  <verify>Create a new account -> Check Supabase 'groups' table for the new group name.</verify>
  <done>Real data is created in Supabase tables upon signup completion.</done>
</task>

<task type="checkpoint:human-verify">
  <name>Onboarding End-to-End</name>
  <files>src/features/auth/pages/Onboarding.tsx</files>
  <action>
    Ask user to run the onboarding with a fresh email and verify that the group appears in their dashboard.
  </action>
  <verify>Manual confirmation.</verify>
  <done>User confirms the flow works.</done>
</task>

## Success Criteria
- [ ] Onboarding CHOICE data is no longer lost on step changes.
- [ ] Account creation triggers real DB inserts (Group, Profile Meta).
- [ ] User is redirected to Home with the new group already active.
