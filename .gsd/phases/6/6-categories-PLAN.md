---
phase: 6
plan: 2
wave: 1
---

# Plan 6.2: Categories Analytics

## Objective
Implement a Categories Analytics section that allows users to view spending breakdowns by category for both Personal finances and Groups, with drill-down capability.

## Context
- .gsd/SPEC.md (Goal 1 & 4)
- src/lib/constants.ts
- src/features/dashboard/pages/PersonalFinance.tsx
- src/features/groups/hooks/useGroups.ts

## Tasks

<task type="auto">
  <name>Define Categories Config</name>
  <files>
    src/lib/constants.ts
    src/index.css
  </files>
  <action>
    1. Create `CATEGORY_CONFIG` constant in `src/lib/constants.ts`.
       - Map standard categories (Compras, Supermercado, Gastronomía, Servicios, Transporte, Varios) to colors, icons (Lucide), and IDs.
    2. Add `getCategoryConfig(name)` helper.
  </action>
  <verify>
    `CATEGORY_CONFIG` exists.
  </verify>
  <done>
    Centralized category configuration.
  </done>
</task>

<task type="auto">
  <name>Create Categories Page (Overview)</name>
  <files>
    src/features/analytics/pages/Categories.tsx
    src/features/analytics/hooks/useCategoryStats.ts
    src/App.tsx
  </files>
  <action>
    1. Create `useCategoryStats.ts`:
       - Accepts a list of generic transactions (amount, category, type).
       - Returns aggregation: total spent, list of { category, total, percentage, count }.
    2. Create `Categories.tsx`:
       - **Scope Switcher**: Tabs/Dropdown for "Personal" | "Mis Grupos" (or specific group).
       - **Data Fetching**: Use `usePersonalTransactions` for Personal scope. Use `useGroups` -> iterate members/balances? Or generic transaction fetch?
         - *Simpler MVP*: Only implement "Personal" scope initially + "Select Group" which uses `useTransactions(groupId)`.
       - **UI**: Display "Total Expenses" card + Grid of Category Cards (with progress bars).
    3. Update `App.tsx` to point `/categories` to this component.
  </action>
  <verify>
    Build check.
  </verify>
  <done>
    User can see spending breakdown by category.
  </done>
</task>

<task type="auto">
  <name>Create Category Detail Page</name>
  <files>
    src/features/analytics/pages/CategoryDetail.tsx
    src/App.tsx
  </files>
  <action>
    1. Create `CategoryDetail.tsx`:
       - Route: `/categories/:scope/:categoryId` (Scope needed: 'personal' or groupId).
       - Or allow query param `?scope=personal`.
       - Logic: Filter transactions by `category === categoryId`.
       - UI: List of transactions (reuse `TransactionCard` or generic equivalent).
    2. Update `App.tsx` routes.
  </action>
  <verify>
    Logic check.
  </verify>
  <done>
    User can drill down into a category to see specific expenses.
  </done>
</task>

## Success Criteria
- [ ] Users can see total spending per category.
- [ ] Users can switch between Personal and Group contexts.
- [ ] Visual consistency with glassmorphism design.
