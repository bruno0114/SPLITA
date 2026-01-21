---
phase: 18
plan: 1
wave: 1
---

# Plan 18.1: Secure Group Join Implementation

## Objective
Enable secure group joining via invite codes (`/unirse/:code`) using `SECURITY DEFINER` RPCs. This ensures users can only join if they possess the valid code, bypassing RLS restrictions for the initial lookup while maintaining strict membership security.

## Context
- .gsd/SPEC.md
- src/context/GroupsContext.tsx
- src/features/groups/pages/JoinGroup.tsx (`/unirse/:code`)

## Constraints & Assumptions
- **Route**: The invite route is `/unirse/:code` (Spanish localization).
- **Invite Codes**: Currently permanent (no expiration). This is known technical debt.
- **Security**: Joining MUST be performed by `code`, not `group_id`, to prevent ID enumeration attacks.
- **Navigation**: User must be redirected to the group page immediately after joining.

## Tasks

<task type="auto">
  <name>Create Join RPCs</name>
  <files>supabase_phase18_join_rpcs.sql</files>
  <action>
    Create a migration file `supabase_phase18_join_rpcs.sql` with:
    1. `get_group_details_by_code(p_code)`:
       - SECURITY DEFINER
       - Returns: id, name, image_url, member_count
       - NO sensitive data (balance, etc.)
    2. `join_group_by_code(p_code)`:
       - SECURITY DEFINER
       - Validates code exists (Exact match).
       - Checks if user is already a member (Idempotent success or specific error).
       - Inserts into `group_members` (role: 'member').
       - Returns: group_id (needed for redirect).
  </action>
  <verify>Run the migration via Supabase tool.</verify>
  <done>Functions exist in database.</done>
</task>

<task type="auto">
  <name>Verify & Update RLS</name>
  <files>supabase_phase18_rls_check.sql</files>
  <action>
    Ensure RLS policies allow new members to immediately interact with the group.
    1. Create `supabase_phase18_rls_check.sql` to explicitly verify/update:
       - `transactions`: New members must SELECT existing transactions.
       - `transaction_splits`: New members must SELECT related splits.
    2. Since we recently fixed RLS recursion, ensure these policies don't conflict.
    3. If policies rely on `check_is_group_member`, they should automatically work for new members.
    4. Apply any necessary policy tweaks if gaps are found.
  </action>
  <verify>Run SQL to confirm policies cover new members.</verify>
  <done>RLS policies confirmed for new members.</done>
</task>

<task type="auto">
  <name>Update Groups Context & Frontend</name>
  <files>src/context/GroupsContext.tsx, src/features/groups/pages/JoinGroup.tsx</files>
  <action>
    Refactor `getGroupByInviteCode` and `joinGroup` to use the new RPCs.
    1. `getGroupByInviteCode`: call `rpc('get_group_details_by_code', { p_code: code })`
    2. `joinGroup`: 
       - Change signature to accept `code` (string) instead of `groupId`.
       - Call `rpc('join_group_by_code', { p_code: code })`.
       - On success, call `fetchGroups()` to refresh list and UI immediately.
    3. Update `JoinGroup.tsx`:
       - Use `joinGroup(inviteCode)` instead of passing ID.
       - Ensure `inviteCode` from URL (`/unirse/:inviteCode`) is passed correctly.
  </action>
  <verify>Build project successfully.</verify>
  <done>Frontend uses RPCs and refreshes data.</done>
</task>

<task type="checkpoint:human-verify">
  <name>Verify Join Flow</name>
  <files>src/features/groups/pages/JoinGroup.tsx</files>
  <action>
    1. Generate a new invite code for a group (or use existing).
    2. Incognito window: Open `/unirse/<code_here>`.
    3. Verify group details appear (Name, Image).
    4. Login/Register.
    5. Click "Unirme".
    6. Verify redirect to `/grupos/<id>` works.
    7. **CRITICAL**: Verify the new member can see PAST transactions in the group.
  </action>
  <verify>Manual confirmation</verify>
  <done>User succesfully joins and sees group data.</done>
</task>

## Success Criteria
- [ ] `/unirse/:code` works for unauthenticated users (shows preview).
- [ ] Joining effectively adds member via RPC using only the code.
- [ ] New members immediately see the group in their list.
- [ ] New members can see existing group transactions (RLS verification).
