# Fix Report: Group Deletion Sync

> **Issue**: Deleted groups reappear in the UI ("zombie groups") due to state divergence between components.
> **Fix**: Implemented centralized state management using React Context.

## The Problem
Previously, `useGroups` was a standard hook. Each component calling it (`Sidebar`, `Groups`, `GroupDetails`) created its **own isolated state instance**.

1. **User deletes** group in `GroupDetails`.
2. `GroupDetails` instance removes it locally.
3. User navigates to `/groups`.
4. `Groups` page instance works with its *own* separate data (which might be stale or refetched with race conditions).
5. `Sidebar` instance also held stale data.

## The Solution
We "lifted state up" to a global provider.

### 1. Created `GroupsContext`
- Holds the **Single Source of Truth** for the groups list.
- Provides global CRUD methods (`create`, `delete`, `update`).
- Optimistically updates the global list immediately upon action.

### 2. Wrapped App in `GroupsProvider`
- Located in `src/index.tsx`.
- Ensures state persists across navigation changes.

### 3. Updated `useGroups` hook
- Now acts as a consumer of the Context.
- No code changes needed in components (API compatible).

## Verification
- **Sidebar & Page Sync**: Both now display the exact same array object from Context.
- **Deletion Flow**:
  1. `deleteGroup(id)` called.
  2. Context removes `id` from `groups` array.
  3. Sidebar and Page re-render simultaneously.
  4. User is redirected.
  5. **No ghost items reappear** because the global state was already cleaned.

## Changed Files
- `[NEW] src/context/GroupsContext.tsx`
- `[MOD] src/index.tsx`
- `[MOD] src/features/groups/hooks/useGroups.ts`
