---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Fix Group Creation RLS Recursion (P0)

## Objective
Resolve the "infinite recursion" error in Supabase RLS policies for `group_members`. This blocker prevents new users from creating groups. We will implement a non-recursive membership check using a PostgreSQL function.

## Context
- .gsd/SPEC.md
- .gsd/ARCHITECTURE.md
- Supabase RLS recursion common patterns

## Tasks

<task type="auto">
  <name>Implement Security Definer Membership Check</name>
  <files>None (PostgreSQL Migration)</files>
  <action>
    Create a SQL migration to:
    1. Define a `checker` function with `SECURITY DEFINER` to check if a user belongs to a group. This bypasses RLS for the membership check itself, breaking the recursion.
    2. Drop existing recursive policies on `group_members`.
    3. Apply new policies using the helper function.
    4. Provide the SQL block to the USER to execute in Supabase SQL Editor (or try apply_migration if privileges allow).
  </action>
  <verify>Documentation of the SQL fix and explanation of why it breaks recursion.</verify>
  <done>User can successfully create a group in the UI without recursion errors.</done>
</task>

<task type="auto">
  <name>Verify RLS for group_members</name>
  <files>src/features/groups/hooks/useGroups.ts</files>
  <action>
    Test the group creation flow using the `useGroups` hook and verify that both the `groups` record and the `group_members` (admin) record are created successfully.
  </action>
  <verify>Successful console log or UI confirmation of group creation.</verify>
  <done>Groups and members can be listed immediately after creation.</done>
</task>

## Success Criteria
- [ ] No more "infinite recursion detected" errors during group creation.
- [ ] Users can view only groups they belong to.
- [ ] Creation flow (Groups + Admin member) completes in a single cycle.
