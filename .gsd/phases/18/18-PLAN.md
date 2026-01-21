---
phase: 18
plan: 1
wave: 1
---

# Plan 18.1: Secure Group Join Implementation

## Objective
Enable secure group joining via invite codes using `SECURITY DEFINER` RPCs to bypass RLS restrictions for non-members, while maintaining strict validation.

## Context
- .gsd/SPEC.md
- src/context/GroupsContext.tsx
- src/features/groups/pages/JoinGroup.tsx

## Tasks

<task type="auto">
  <name>Create Join RPCs</name>
  <files>supabase_phase18_join_rpcs.sql</files>
  <action>
    Create a migration file `supabase_phase18_join_rpcs.sql` with:
    1. `get_group_details_by_code(p_code)`:
       - SECURITY DEFINER
       - Returns: id, name, image_url, member_count (count of group_members)
       - NO sensitive data (balance, etc.)
    2. `join_group_by_code(p_code)`:
       - SECURITY DEFINER
       - Validates code exists
       - Checks if user already member
       - Inserts into `group_members` (role: 'member')
       - Returns: group_id
  </action>
  <verify>Run the migration via Supabase tool.</verify>
  <done>Functions exist in database.</done>
</task>

<task type="auto">
  <name>Update Groups Context</name>
  <files>src/context/GroupsContext.tsx</files>
  <action>
    Refactor `getGroupByInviteCode` and `joinGroup` to use the new RPCs.
    - `getGroupByInviteCode`: call `rpc('get_group_details_by_code', { p_code: code })`
    - `joinGroup`: call `rpc('join_group_by_code', { p_code: inviteCode })` *Wait, JoinGroup.tsx passes ID, but RPC needs Code for security validation?*
      - Correction: `joinGroup` currently takes ID.
      - We should refactor `joinGroup` to take `code` OR update the flow.
      - If `JoinGroup.tsx` already fetched the group via code, it has the ID.
      - BUT relying on ID for the join is insecure if anyone can guess an ID.
      - BETTER: Pass `code` to `joinGroup` as well to prove possession of the secret.
    - Update `JoinGroup.tsx` to pass the code to `joinGroup`.
  </action>
  <verify>Build project successfully.</verify>
  <done>Frontend uses RPCs.</done>
</task>

<task type="checkpoint:human-verify">
  <name>Verify Join Flow</name>
  <files>src/features/groups/pages/JoinGroup.tsx</files>
  <action>
    1. Generate a new invite code for a group.
    2. Incognito window: Open `/unirse/:code`.
    3. Verify group details appear (Name, Image).
    4. Login/Register.
    5. Click "Unirme".
    6. Verify redirect to group page.
  </action>
  <verify>Manual confirmation</verify>
  <done>User successfully joins group.</done>
</task>

## Success Criteria
- [ ] Unauthenticated users can see group preview via code.
- [ ] Authenticated users can join via code.
- [ ] RLS policies remain strict (no public read on all groups).
