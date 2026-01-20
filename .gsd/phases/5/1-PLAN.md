---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Group Settings & Edit Recovery (P0)

## Objective
Restore functionality to the Group Settings and Edit actions that are currently non-functional. This includes updating group metadata (name, currency) and potentially the group image.

## Context
- .gsd/SPEC.md
- src/features/groups/hooks/useGroups.ts
- src/features/groups/pages/GroupDetails.tsx (Assuming this page exists for detail view)
- Supabase 'groups' table

## Tasks

<task type="auto">
  <name>Implement Update Group Service</name>
  <files>src/features/groups/hooks/useGroups.ts</files>
  <action>
    - Add an `updateGroup` function to the `useGroups` hook.
    - Support updating `name`, `currency`, and `image_url` (ensure this column exists in DB or add via migration if needed).
    - Use `.select().single()` to update the local state correctly after successful DB update.
  </action>
  <verify>Check useGroups.ts for the exported updateGroup function.</verify>
  <done>`updateGroup` is available and correctly interfaces with the 'groups' table.</done>
</task>

<task type="auto">
  <name>Wire Group Settings Actions</name>
  <files>src/features/groups/pages/GroupDetails.tsx</files>
  <action>
    - Locate the "Modify group" or "Settings" modal/view.
    - Connect the UI inputs to the new `updateGroup` hook function.
    - Add loading and success states consistent with existing patterns (glassmorphism/loaders).
    - Ensure no browser alerts are used.
  </action>
  <verify>Visual verification of settings persistence after a change.</verify>
  <done>Users can update group metadata and see changes reflected in the UI.</done>
</task>

## Success Criteria
- [ ] Group name and currency can be updated and persisted in Supabase.
- [ ] UI feedback is provided for saving/error states.
- [ ] No regressions in RLS for viewing group details.
