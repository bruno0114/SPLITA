---
phase: 1
plan: 1.1
wave: 1
---

# Plan 1.1: Architecture Restructure

## Objective
Establish a scalable, feature-based folder structure and install routing dependencies. This prepares the codebase for the routing implementation without changing logic yet.

## Context
- .gsd/SPEC.md (Goal 1: Architecture & Routing)
- .gsd/ARCHITECTURE.md
- vite.config.ts (Alias '@' is confirmed)

## Tasks

<task type="auto">
  <name>Install Dependencies</name>
  <files>package.json</files>
  <action>
    Install `react-router-dom` and its types.
    - `npm install react-router-dom`
    - `npm install -D @types/react-router-dom`
  </action>
  <verify>grep "react-router-dom" package.json</verify>
  <done>Package installed</done>
</task>

<task type="auto">
  <name>Create Folder Structure</name>
  <files>src/features, src/components/layout, src/components/ui, src/hooks, src/utils, src/types</files>
  <action>
    Create the following directory structure:
    - `src/features/auth` (pages, components)
    - `src/features/dashboard` (pages, components)
    - `src/features/groups` (pages, components)
    - `src/features/expenses` (pages, components)
    - `src/components/layout`
    - `src/components/ui`
    - `src/lib` (for constants, utils)
  </action>
  <verify>ls -R src/features</verify>
  <done>Directories exist</done>
</task>

<task type="auto">
  <name>Migrate Files</name>
  <files>src/**/*</files>
  <action>
    Move files to their new locations:
    
    **Shared:**
    - `components/Sidebar.tsx`, `Header.tsx`, `BottomNav.tsx` -> `components/layout/`
    - `types.ts` -> `types/index.ts`
    - `constants.ts` -> `lib/constants.ts`
    
    **Features:**
    - `pages/Login.tsx`, `pages/Onboarding.tsx` -> `features/auth/pages/`
    - `pages/PersonalFinance.tsx`, `pages/EconomicHealth.tsx` -> `features/dashboard/pages/`
    - `pages/Groups.tsx`, `pages/GroupDetails.tsx` -> `features/groups/pages/`
    - `pages/ImportExpenses.tsx` -> `features/expenses/pages/`
    - `pages/Settings.tsx` -> `features/settings/pages/` (Create feature)
    
    **Cleanup:**
    - Remove empty `pages` directory.
  </action>
  <verify>ls src/features/auth/pages/Login.tsx</verify>
  <done>Files moved</done>
</task>

<task type="auto">
  <name>Fix Imports</name>
  <files>src/**/*</files>
  <action>
    Update imports in all moved files to fix broken paths.
    - Update `App.tsx` imports to point to new locations.
    - Update internal imports (e.g., `types`, `constants`) in all components.
    - Use `@/` alias where appropriate (already configured in vite.config.ts).
    
    *Strategy:*
    - Use `sed` to replace `../types` with `@/types`.
    - Use `sed` to replace `../constants` with `@/lib/constants`.
    - Fix component imports in `App.tsx`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>TypeScript compiles without error</done>
</task>

## Success Criteria
- [ ] Directory structure follows feature-based architecture.
- [ ] `react-router-dom` is installed.
- [ ] Application compiles (`tsc`) despite moves (imports fixed).
