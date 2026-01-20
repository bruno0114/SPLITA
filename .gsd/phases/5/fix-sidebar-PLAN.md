---
phase: 5
plan: fix-sidebar-active-state
wave: 1
gap_closure: true
---

# Fix Plan: Sidebar Active State

## Problem
The sidebar highlights "Finanzas personales" when viewing a group details page. It should highlight "Mis Grupos".

## Tasks

<task type="auto">
  <name>Update AppRoute Mapping</name>
  <files>src/App.tsx</files>
  <action>
    - Update `getAppRoute` to correctly detect `/groups/:id` and return `AppRoute.DASHBOARD_GROUPS` or a more specific route if needed.
  </action>
  <verify>Check getAppRoute return value for group paths.</verify>
  <done>getAppRoute returns DASHBOARD_GROUPS for group details.</done>
</task>

<task type="auto">
  <name>Refine Sidebar Highlighting</name>
  <files>src/components/layout/Sidebar.tsx</files>
  <action>
    - Ensure `NavItem` for "Mis Grupos" remains active when viewing a group.
  </action>
  <verify>Visually verify Sidebar highlight on group detail pages.</verify>
  <done>Sidebar correctly reflects active section.</done>
</task>
