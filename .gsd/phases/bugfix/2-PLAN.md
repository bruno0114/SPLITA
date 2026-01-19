---
phase: bugfix
plan: 2
wave: 1
---

# Plan BF.2: Fix CRUD Operations Not Reflecting in UI

## Objective
Fix the issue where adding personal transactions, creating groups, or updating profile doesn't show changes in the UI immediately.

## Context
- src/features/dashboard/hooks/usePersonalTransactions.ts
- src/features/groups/hooks/useGroups.ts
- src/features/settings/hooks/useProfile.ts
- src/features/dashboard/pages/PersonalFinance.tsx

## Root Cause Analysis

After investigation, the hooks DO call refresh functions after mutations:
- `usePersonalTransactions.addTransaction` calls `fetchTransactions()` (line 106)
- `useGroups.createGroup` calls `fetchGroups()` (line 94)
- `useProfile.updateProfile` updates local state via `setProfile(data)` (line 63)

**Potential issues:**
1. Refresh calls are NOT awaited (fire-and-forget)
2. RLS policies might be blocking reads after insert
3. Supabase session might not be established when hooks first mount

## Tasks

<task type="auto">
  <name>Await refresh calls after mutations</name>
  <files>
    src/features/dashboard/hooks/usePersonalTransactions.ts
    src/features/groups/hooks/useGroups.ts
  </files>
  <action>
    Change non-awaited refresh calls to awaited:
    - usePersonalTransactions: `await fetchTransactions()` after insert/delete
    - useGroups: `await fetchGroups()` after createGroup
    This ensures UI updates only AFTER data is re-fetched
  </action>
  <verify>grep -n "fetchTransactions\|fetchGroups" src/features/dashboard/hooks/*.ts src/features/groups/hooks/*.ts</verify>
  <done>All refresh calls after mutations are awaited</done>
</task>

<task type="auto">
  <name>Add error logging for RLS failures</name>
  <files>
    src/features/dashboard/hooks/usePersonalTransactions.ts
    src/features/groups/hooks/useGroups.ts
  </files>
  <action>
    After each Supabase mutation, add console.log for:
    - Success: log the inserted data
    - Error: log full error object including code and message
    This helps debug RLS issues
  </action>
  <verify>Run app, add transaction, check browser console</verify>
  <done>Console shows insert success/failure with details</done>
</task>

<task type="auto">
  <name>Verify RLS allows self-insert for personal_transactions</name>
  <files>Supabase RLS policies</files>
  <action>
    Check that personal_transactions RLS policy allows:
    - SELECT where user_id = auth.uid()
    - INSERT where user_id = auth.uid()
    - UPDATE/DELETE where user_id = auth.uid()
    Current policy uses FOR ALL which should work
  </action>
  <verify>Query pg_policies for personal_transactions</verify>
  <done>RLS confirmed to allow self CRUD</done>
</task>

## Success Criteria
- [ ] Adding a personal transaction immediately appears in the list
- [ ] Creating a group immediately appears in the groups list
- [ ] Updating profile immediately reflects in Settings page
- [ ] No RLS errors in browser console
