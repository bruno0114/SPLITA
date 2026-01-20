---
phase: 5
plan: 2
wave: 2
---

# Plan 5.2: Group Invite & Join Flow (P0)

## Objective
Enable users to invite others via a shareable link and process joining of the correct group upon link access.

## Context
- src/features/groups/hooks/useGroups.ts
- src/features/groups/pages/GroupDetails.tsx
- App.tsx (for routing)
- Supabase 'groups' and 'group_members' tables

## Tasks

<task type="auto">
  <name>Invite Code Generation & Link Sharing</name>
  <files>src/features/groups/hooks/useGroups.ts,src/features/groups/pages/GroupDetails.tsx</files>
  <action>
    - Add `invite_code` to the `groups` table (via SQL migration) if missing.
    - Create a function to generate/reset invite codes.
    - In `GroupDetails.tsx`, implement the "Invite" button to copy a link like `window.location.origin + "/join/" + group.invite_code`.
    - Show a non-blocking "Link copiado" toast/success message.
  </action>
  <verify>Verification of the generated link and presence of invite_code in DB.</verify>
  <done>Invite button copies a valid URL with a unique group code.</done>
</task>

<task type="auto">
  <name>Join Page and Logic</name>
  <files>src/features/groups/pages/JoinGroup.tsx,App.tsx</files>
  <action>
    - Create a new `JoinGroup.tsx` page component.
    - Logic: 
      1. Extract code from URL.
      2. Check if user is logged in (use `ProtectedRoute` logic or manual check).
      3. If not, redirect to Login but preserve the join goal in state/URL.
      4. If logged in, show "Te invitaron a [Group Name]. ¿Deseas unirte?".
      5. On confirm, insert into `group_members` and redirect to group details.
    - Add the route to `App.tsx`.
  </action>
  <verify>End-to-end verification: Link -> Login -> Joined.</verify>
  <done>A guest user can follow a link, log in, and become a member of the group.</done>
</task>

## Success Criteria
- [ ] Unique shareable links generated per group.
- [ ] Joining logic correctly handles auth state (redirects to login if needed).
- [ ] Users successfully added to `group_members` table with 'member' role.
