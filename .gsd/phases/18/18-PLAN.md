---
phase: 18
plan: 1
wave: 1
---

# Plan 18.1: Secure Group Join Implementation

## Objective
Enable secure group joining via invite codes (`/unirse/:code`) using `SECURITY DEFINER` RPCs. Ensure all generated invite links use the localized route, while maintaining backward compatibility for any existing `/join/:code` links.

## Context
- src/context/GroupsContext.tsx
- src/features/groups/pages/JoinGroup.tsx (`/unirse/:code`)
- src/features/groups/components/InviteModal.tsx (Link generation)
- src/App.tsx (Routing)

## Constraints & Assumptions
- **Route**: The primary route is `/unirse/:code`.
- **Legacy Route**: `/join/:code` must redirect to `/unirse/:code`.
- **Security**: Joining MUST be performed by `code`, not `group_id`.
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
    2. `join_group_by_code(p_code)`:
       - SECURITY DEFINER
       - Validates code exists.
       - Checks membership (Idempotent).
       - Inserts into `group_members`.
       - Returns: group_id.
  </action>
  <verify>Run the migration via Supabase tool.</verify>
  <done>Functions exist in database.</done>
</task>

<task type="auto">
  <name>Verify & Update RLS</name>
  <files>supabase_phase18_rls_check.sql</files>
  <action>
    Ensure RLS policies allow new members to immediately interact with the group.
    - Create `supabase_phase18_rls_check.sql` to explicitly verify policy coverage.
  </action>
  <verify>Run SQL to confirm policies cover new members.</verify>
  <done>RLS policies confirmed.</done>
</task>

<task type="auto">
  <name>Update Frontend Logic</name>
  <files>src/context/GroupsContext.tsx, src/features/groups/pages/JoinGroup.tsx</files>
  <action>
    Refactor `getGroupByInviteCode` and `joinGroup` to use the new RPCs.
    - `joinGroup` must accept `code` and call `rpc('join_group_by_code')`.
    - `JoinGroup.tsx` must pass the code from URL params.
  </action>
  <verify>Build project successfully.</verify>
  <done>Frontend uses RPCs.</done>
</task>

<task type="auto">
  <name>Fix Link Generation & Routing</name>
  <files>src/features/groups/components/InviteModal.tsx, src/App.tsx</files>
  <action>
    1. **Update Link Generation**:
       - In `InviteModal.tsx`, change `${window.location.origin}/join/${inviteCode}` to `${window.location.origin}/unirse/${inviteCode}`.
    2. **Add Backward Compatibility**:
       - In `App.tsx`, add a route: `<Route path="/join/:inviteCode" element={<Navigate to="/unirse/:inviteCode" replace />} />`.
       - Ensure it captures the param and passes it to the new route.
  </action>
  <verify>Check file content for correct strings.</verify>
  <done>Links generate with /unirse/ and old links redirect.</done>
</task>

<task type="checkpoint:human-verify">
  <name>Verify Join Flow</name>
  <files>src/features/groups/pages/JoinGroup.tsx</files>
  <action>
    1. **Test New Link**: Copy link from Invite Modal. Paste in new tab. Verify it is `/unirse/...`.
    2. **Test Old Link**: Manually type `/join/<code_here>`. Verify it redirects to `/unirse/...`.
    3. **Test Join**: Click validation. Verify success and redirect to group.
  </action>
  <verify>Manual confirmation</verify>
  <done>Flow works for both route variants.</done>
</task>

## Success Criteria
- [ ] Invite Modal generates `/unirse/` links.
- [ ] `/join/:code` redirects to `/unirse/:code`.
- [ ] Joining via code works securely via RPC.
