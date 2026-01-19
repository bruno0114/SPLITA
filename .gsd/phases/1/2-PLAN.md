---
phase: 1
plan: 1.2
wave: 2
---

# Plan 1.2: Implement Routing Logic

## Objective
Replace manual state-based routing with `react-router-dom`, implementing a proper Layout component and preserving the existing UI structure.

## Context
- .gsd/SPEC.md (Goal 1)
- src/App.tsx (Current layout logic)
- src/components/layout/Sidebar.tsx (Navigation logic)

## Tasks

<task type="auto">
  <name>Create App Context</name>
  <files>src/context/AppContext.tsx</files>
  <action>
    Create a context to manage global state (Theme, Currency).
    - Move state logic (`useState`, `useEffect` for theme) from `App.tsx` here.
    - Export `AppContextProvider` and `useApp` hook.
    - Providing: `theme`, `setTheme`, `currency`, `setCurrency`, `exchangeRate`, `setExchangeRate`.
  </action>
  <verify>ls src/context/AppContext.tsx</verify>
  <done>Context created</done>
</task>

<task type="auto">
  <name>Create Layout Component</name>
  <files>src/components/layout/AppLayout.tsx</files>
  <action>
    Create `AppLayout` component.
    - Move the main layout structure (divs, background ambience) from `App.tsx` here.
    - Render `Sidebar`, `Header`, `BottomNav`.
    - Render `<Outlet />` in the `<main>` area.
    - Consume `useApp` context for theme/currency/state needed by Layout components.
    - Manage `isSidebarCollapsed` local state here.
  </action>
  <verify>ls src/components/layout/AppLayout.tsx</verify>
  <done>Layout created</done>
</task>

<task type="auto">
  <name>Configure Routes</name>
  <files>src/routes/index.tsx</files>
  <action>
    Create `src/routes/index.tsx` using `createBrowserRouter`.
    - Define public routes: `/login`, `/onboarding`.
    - Define protected routes (wrapped in `AppLayout`):
      - `/` -> Redirect to `/dashboard`
      - `/dashboard` -> `PersonalFinance`
      - `/groups` -> `Groups`
      - `/groups/:id` -> `GroupDetails`
      - `/health` -> `EconomicHealth`
      - `/import` -> `ImportExpenses`
      - `/settings` -> `Settings`
  </action>
  <verify>ls src/routes/index.tsx</verify>
  <done>Routes defined</done>
</task>

<task type="auto">
  <name>Update Navigation Components</name>
  <files>src/components/layout/Sidebar.tsx, src/components/layout/BottomNav.tsx, src/components/layout/Header.tsx</files>
  <action>
    Refactor navigation components to use `NavLink` (active state) or `Link` from `react-router-dom`.
    - `Sidebar.tsx`: Replace `div` button with `NavLink to="..."`.
    - `BottomNav.tsx`: Replace with `NavLink`.
    - Remove `onNavigate` props and interface definitions.
  </action>
  <verify>grep "NavLink" src/components/layout/Sidebar.tsx</verify>
  <done>Components use Router links</done>
</task>

<task type="auto">
  <name>Refactor App.tsx</name>
  <files>src/App.tsx</files>
  <action>
    Replace entire `App.tsx` content.
    - Wrap everything in `AppContextProvider`.
    - Render `<RouterProvider router={router} />`.
  </action>
  <verify>grep "RouterProvider" src/App.tsx</verify>
  <done>App.tsx refactored</done>
</task>

## Success Criteria
- [ ] Application loads without errors.
- [ ] Navigation changes URL (e.g. `/groups`).
- [ ] Back/Forward browser buttons work.
- [ ] Layout (Sidebar/Header) persists between page navigations.
- [ ] Themes and Currency switches still work.
