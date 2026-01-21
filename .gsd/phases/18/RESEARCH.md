# Research: Phase 18 - Group Join Links

## Goal
Make `/join/:code` functional securely.

## Current State Analysis

### Database
- **Table**: `groups`
- **Need to verify**: Does `invite_code` column exist?
  - *Method*: Checking frontend usage (hooks) since SQL tool failed.
- **RPC Needed**: `join_group_by_code(code)`
  - *Logic*: 
    1. Find group by code (exact match).
    2. Check if user is already member.
    3. If not, insert into `group_members`.
    4. Return `group_id` for navigation.

### Frontend
- **Route**: `/join/:code`
- **Component**: Likely `JoinGroup` or logic inside `App.tsx` / `main.tsx`.
- **Auth Handling**: Needs to redirect to login if no session, then resume join.

## Implementation Strategy
1. **Schema Check**: If `invite_code` missing, add it. Index it for lookup.
2. **RPC Creation**: `join_group_by_code` (SECURITY DEFINER to bypass RLS need for non-members finding group by code).
3. **Frontend Wiring**:
   - `useEffect` to capture code.
   - `useAuth` to check user.
   - Call RPC.
   - Redirect to `/dashboard/groups/:id`.

## Risks
- **Enumeration**: Codes should be long/random enough.
- **RLS**: New members need immediate access.
