---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: Navigation Polish

## Objective
Enhance navigation accessibility and structure to support new features. specifically ensuring Logout is always accessible on desktop and preparing the app for the Categories section.

## Context
- .gsd/SPEC.md (Goal 1: Routing)
- src/components/layout/Sidebar.tsx
- src/components/layout/Header.tsx
- src/App.tsx

## Tasks

<task type="auto">
  <name>Update App Routes & Types</name>
  <files>
    src/types/index.ts
    src/App.tsx
  </files>
  <action>
    1. Add `CATEGORIES = 'categories'` to `AppRoute` enum in `src/types/index.ts`.
    2. Update `getAppRoute` in `src/App.tsx` to handle `/categories`.
    3. Update `handleNavigate` in `src/App.tsx` to handle `AppRoute.CATEGORIES`.
    4. update `getRouteTitle` in `src/App.tsx`.
    5. Add placeholder route `<Route path="/categories" element={<div className="p-10">Categories Placeholder</div>} />` in `App.tsx` (temporarily until Plan 6.2).
  </action>
  <verify>
    Check `src/types/index.ts` contains `CATEGORIES`.
  </verify>
  <done>
    `AppRoute.CATEGORIES` exists and routing logic handles it.
  </done>
</task>

<task type="auto">
  <name>Add Categories to Sidebar</name>
  <files>src/components/layout/Sidebar.tsx</files>
  <action>
    Add a new `NavItem` for "Categorías" in the "Principal" section of the Sidebar.
    - Icon: `PieChart` (from lucide-react).
    - Route: `AppRoute.CATEGORIES`.
    - Active state: `currentRoute === AppRoute.CATEGORIES`.
  </action>
  <verify>
    Render `Sidebar` or logical check of code insertion.
  </verify>
  <done>
    Sidebar includes Categories link.
  </done>
</task>

<task type="auto">
  <name>Add Desktop Logout to Header</name>
  <files>src/components/layout/Header.tsx</files>
  <action>
    Add a `LogOut` button to the desktop actions area (right side) of `Header.tsx`.
    - Position: Next to the separator line or Bell icon.
    - Visibility: `hidden md:flex` (desktop only).
    - Style: Consistent with other header buttons (rounded-full, bg-surface).
    - Action: `onLogout`.
    - Tooltip: "Cerrar sesión".
  </action>
  <verify>
    Logical check: Button exists in desktop view conditional.
  </verify>
  <done>
    Logout button is accessible in desktop header.
  </done>
</task>

## Success Criteria
- [ ] Logout is always accessible on desktop, regardless of sidebar collapse state.
- [ ] Sidebar links to /categories.
- [ ] Routing architecture is ready for Analytics pages.
