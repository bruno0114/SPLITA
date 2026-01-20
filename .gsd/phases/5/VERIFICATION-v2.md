---
phase: 5
verified_at: 2026-01-20T02:01:14-03:00
verdict: FAIL
issue: cache-invalidation
---

# Phase 5 Gap Closure — Second Verification

## Summary
Gap closure code changes applied, but **groups list still shows deleted group** due to state architecture.

## Root Cause Analysis

### Verdict: **Category B** — Frontend state not invalidated

The issue is **not** DB-related. The codebase uses **local React state per hook instance**.

```
┌─────────────────┐     ┌─────────────────┐
│  GroupDetails   │     │     Groups      │
│                 │     │                 │
│  useGroups() ◄──┼─────┼── useGroups()  │
│  (instance A)   │     │  (instance B)   │
│                 │     │                 │
│  groups: [...]  │     │  groups: [...]  │
└─────────────────┘     └─────────────────┘
         │                      │
         │ deleteGroup()        │ fetchGroups() on mount
         │ calls fetchGroups()  │ (BUT with stale membership)
         └──────────────────────┘
```

### Evidence

**1. Each component has independent state:**
- [useGroups.ts:8](file:///Users/brunoaguilar/SPLITA-1/src/features/groups/hooks/useGroups.ts#L8): `const [groups, setGroups] = useState<Group[]>([]);`
- This creates **new state for every hook call**.

**2. deleteGroup flow:**
- [useGroups.ts:199-217](file:///Users/brunoaguilar/SPLITA-1/src/features/groups/hooks/useGroups.ts#L199-217):
  - Deletes from DB ✅
  - Calls `await fetchGroups()` ✅ (but updates **its own** `groups` state, not Groups.tsx's)
  - Shows toast ✅

**3. Navigation race condition:**
- [GroupDetails.tsx:405-406](file:///Users/brunoaguilar/SPLITA-1/src/features/groups/pages/GroupDetails.tsx#L405-406):
  - After delete succeeds, immediately calls `onBack()` → navigates to `/groups`
  - `Groups.tsx` mounts → calls `useGroups()` → new instance with `useEffect` fetch
  - **Problem**: The new fetch might return before DB replication/cache is cleared OR React Navigation happens before `await fetchGroups()` completes in the original instance.

### DB Truth Check
The DB delete **does succeed** (CASCADE now works). The issue is purely frontend.

## Files Involved

| File | Line | Issue |
|------|------|-------|
| [useGroups.ts](file:///Users/brunoaguilar/SPLITA-1/src/features/groups/hooks/useGroups.ts) | 8 | Local state per instance |
| [useGroups.ts](file:///Users/brunoaguilar/SPLITA-1/src/features/groups/hooks/useGroups.ts) | 210 | fetchGroups updates wrong instance |
| [GroupDetails.tsx](file:///Users/brunoaguilar/SPLITA-1/src/features/groups/pages/GroupDetails.tsx) | 405-406 | Navigation before state propagates |

## Fix Options

### Option A: Lift state to Context (Recommended)
Create `GroupsContext` to share state across all consumers:
```tsx
// src/context/GroupsContext.tsx
const GroupsContext = createContext(...);
export const GroupsProvider = ({ children }) => {
  // Single source of truth for groups
};
```

### Option B: Optimistic removal before navigation
In `GroupDetails.tsx`, filter out the group immediately:
```tsx
// Before navigating, update shared state
setGroups(prev => prev.filter(g => g.id !== id));
```

### Option C: Force refetch on mount
Add a timestamp/key to force remount:
```tsx
// In Groups.tsx
useEffect(() => { refreshGroups(); }, [location.key]);
```

## Minimal Fix (Option C)
Least invasive — add a refetch in `Groups.tsx` when it mounts or when the route changes.
