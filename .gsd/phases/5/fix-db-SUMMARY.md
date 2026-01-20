---
phase: 5
plan: fix-db-schema-cascade
status: COMPLETE
---

# Summary: DB Schema & Cascade Deletes

Created `supabase_db_fix_v2.sql` to:
1. Add `updated_at` to `groups`.
2. Add `ON DELETE CASCADE` to `group_members`, `transactions`, and `transaction_splits`.

**Execution Required:** The user must run this script in the Supabase SQL Editor.
