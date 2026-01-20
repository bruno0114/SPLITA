# Fix Plan: Group Deletion Consistency & Permissions

## 1. Problem Diagnosis
The user experienced two main bugs when deleting a group:
- **Zombie Group**: After deletion, the group reappeared in the list.
- **State Loop**: The app seemed to "reload" or enter a loop during deletion.

### Root Causes
1. **Missing RLS Policy**: There was no `FOR DELETE` policy on the `groups` table. Supabase was silently ignoring the delete request (matching 0 rows).
2. **State Divergence**: Components had isolated states. `GroupDetails` deleted its local copy, but `Groups` page refetched the (non-deleted) item from Supabase.
3. **Silent Errors**: The `delete` call returned no error even if RLS blocked it, because "0 rows deleted" is technically not an error to Supabase/PostgREST.

## 2. Solutions Implemented

### Wave 1: Database Permissions (RLS)
- Applied migration to allow `DELETE` for group owners.
- Added `DELETE` for group members (to support "leaving" a group).
- Verified `ON DELETE CASCADE` is active for transactions and members.

### Wave 2: Centralized State (Context)
- Created `GroupsContext` as the Single Source of Truth for the entire app.
- Hoisted `groups`, `createGroup`, and `deleteGroup` logic to this context.
- Updated `useGroups` hook to re-export context state, maintaining API compatibility.

### Wave 3: UI/UX Robustness
- **Strict Checks**: `deleteGroup` now checks `{ count: 'exact' }`. If 0 rows are deleted (due to RLS), it throws a visible error.
- **Transition Jitter**: Removed redundant `refreshGroups` from the `Groups` page mount to prevent race conditions during navigation.
- **New Feature**: Added "Salir del Grupo" (Leave Group) for members who are not owners, preventing them from trying to delete and failing.

## 3. Verification Steps
1. **Delete as Owner**: Group is removed from DB, Sidebar, and List simultaneously. No reappearance.
2. **Leave as Member**: Membership removed, group disappears from user's view.
3. **Optimistic Sync**: Deletion is immediate in UI; refetches happen in background.
