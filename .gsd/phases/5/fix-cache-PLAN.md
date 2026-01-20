---
phase: 5
plan: fix-cache-invalidation
wave: 1
gap_closure: true
---

# Fix Plan: Cache Invalidation on Group Deletion

## Objective
Ensure deleted groups disappear immediately from the Groups grid and never reappear.

## Context
- [VERIFICATION-v2.md](file:///Users/brunoaguilar/SPLITA-1/.gsd/phases/5/VERIFICATION-v2.md)
- [useGroups.ts](file:///Users/brunoaguilar/SPLITA-1/src/features/groups/hooks/useGroups.ts)
- [GroupDetails.tsx](file:///Users/brunoaguilar/SPLITA-1/src/features/groups/pages/GroupDetails.tsx)
- [Groups.tsx](file:///Users/brunoaguilar/SPLITA-1/src/features/groups/pages/Groups.tsx)

## Tasks

<task type="auto">
  <name>Add optimistic removal to deleteGroup</name>
  <files>src/features/groups/hooks/useGroups.ts</files>
  <action>
    - Remove group from local state BEFORE DB call
    - If DB call fails, refetch to rollback
    - Export `setGroups` in return object
    - Return `{ error, success }` from deleteGroup
  </action>
  <verify>grep -n "setGroups(prev => prev.filter" useGroups.ts</verify>
  <done>deleteGroup optimistically removes group from state</done>
</task>

<task type="auto">
  <name>Fix navigation timing in GroupDetails</name>
  <files>src/features/groups/pages/GroupDetails.tsx</files>
  <action>
    - Check result.success before navigating
    - Add setTimeout(50ms) before navigation to allow state propagation
    - Remove setDeleting(false) from finally (navigating away)
  </action>
  <verify>grep -n "setTimeout" GroupDetails.tsx</verify>
  <done>Navigation happens after state update completes</done>
</task>

<task type="auto">
  <name>Add safety refetch in Groups</name>
  <files>src/features/groups/pages/Groups.tsx</files>
  <action>
    - Destructure refreshGroups from useGroups()
    - Add useEffect to call refreshGroups() on mount
  </action>
  <verify>grep -n "refreshGroups" Groups.tsx</verify>
  <done>Groups always fetches fresh data on mount</done>
</task>

## Success Criteria
- [ ] Delete group → disappears immediately from grid
- [ ] Navigate back → group still gone
- [ ] Hard refresh → group confirmed deleted from DB
