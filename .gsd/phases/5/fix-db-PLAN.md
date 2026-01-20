---
phase: 5
plan: fix-db-schema-cascade
wave: 1
gap_closure: true
---

# Fix Plan: DB Schema & Cascade Deletes

## Problem
1. Missing `updated_at` column in `groups` causes update failures.
2. Missing `ON DELETE CASCADE` prevents group deletion if members/tx exist.

## Tasks

<task type="auto">
  <name>Create DB Fix Script</name>
  <files>supabase_db_fix_v2.sql</files>
  <action>
    - Add `updated_at` to `groups` table.
    - Set default `timezone('utc'::text, now())`.
    - Drop and recreate foreign keys with `ON DELETE CASCADE` for:
      - `group_members.group_id`
      - `transactions.group_id`
      - `transaction_splits.transaction_id` (already should be, but verify)
  </action>
  <verify>Check SQL content and execution instructions.</verify>
  <done>SQL script ready for execution.</done>
</task>
