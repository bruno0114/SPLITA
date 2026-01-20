---
phase: 5
plan: fix-group-deletion
wave: 1
gap_closure: true
---

# Fix Plan: Group Deletion

## Problem
Users cannot delete groups. Group owners should have the option to delete a group they created.

## Tasks

<task type="auto">
  <name>Add deleteGroup service</name>
  <files>src/features/groups/hooks/useGroups.ts</files>
  <action>
    - Implement `deleteGroup(id)` function using Supabase `.delete()`.
    - Ensure it is exported by the hook.
  </action>
  <verify>Check hook exports.</verify>
  <done>deleteGroup is available in useGroups.</done>
</task>

<task type="auto">
  <name>Integrate Delete UI</name>
  <files>src/features/groups/pages/GroupDetails.tsx</files>
  <action>
    - Add "Eliminar Grupo" button to `GroupSettingsModal`.
    - Implement double confirmation (standard browser alert is fine for destructive actions or a custom inline confirmation).
    - Implement the actual deletion call and navigate back to `/groups` on success.
    - Conditionally show delete button only if `user.id === group.created_by`.
  </action>
  <verify>Verify button appears for owner and triggers deletion.</verify>
  <done>Group deletion is functional and safe.</done>
</task>
