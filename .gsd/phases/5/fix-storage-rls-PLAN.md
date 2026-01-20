---
phase: 5
plan: fix-storage-rls
wave: 1
gap_closure: true
---

# Fix Plan: Storage RLS for Group Images

## Problem
Image uploads fail with RLS violation because the code tries to upload to `avatars` bucket with a filename pattern `group_{id}_{ts}.webp` which typical "Individual User" policies block.

## Tasks

<task type="auto">
  <name>Create Storage RLS Fix Script</name>
  <files>supabase_storage_fix.sql</files>
  <action>
    - Create a SQL script that:
      1. Ensures 'avatars' bucket exists and is public.
      2. Adds a policy for `INSERT` on `storage.objects` allowing authenticated users to upload if the path starts with 'group_'.
      3. Adds a policy for `SELECT` allowing anyone to view.
      4. (Optional but better) Restrict upload to members of the group by parsing the ID from the filename, but for "Gap Closure" a simpler "Authenticated upload to group_ prefix" is acceptable.
  </action>
  <verify>Check file content.</verify>
  <done>SQL script is ready for user execution.</done>
</task>
