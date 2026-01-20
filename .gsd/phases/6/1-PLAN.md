---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: Navigation & Categories Analytics (P1)

## Objective
Improve logout accessibility and implement the core of the Categories analytics section.

## Context
- src/components/layout/Header.tsx
- src/features/dashboard/pages/CategoriesAnalytics.tsx (New)
- src/features/expenses/hooks/useTransactions.ts

## Tasks

<task type="auto">
  <name>Header Logout Upgrade</name>
  <files>src/components/layout/Header.tsx</files>
  <action>
    - Add a `LogOut` icon/button to the top header.
    - Style it with glassmorphism to match the theme.
    - Wire it to the `signOut` function from `useAuth`.
    - Ensure visibility on both desktop and mobile versions of the header.
  </action>
  <verify>Functional check of logout from the top navbar.</verify>
  <done>Logout is always accessible regardless of sidebar state.</done>
</task>

<task type="auto">
  <name>Categories Spending Overview</name>
  <files>src/features/dashboard/pages/CategoriesAnalytics.tsx,src/features/dashboard/hooks/useSpendingByCategory.ts</files>
  <action>
    - Implement a hook `useSpendingByCategory` that aggregates expenses by category from DB.
    - Create `CategoriesAnalytics.tsx` page to display:
      - Total spend per category (ProgressBar or PieChart style matching the theme).
      - Clicking a category navigates to `/categories/:categoryId` drilldown.
    - Ensure integration with both Personal and Group contexts if feasible.
  </action>
  <verify>Visual verification of spending data aggregated correctly.</verify>
  <done>Users can see a high-level summary of where their money is going.</done>
</task>

## Success Criteria
- [ ] Logout button present and functional in Header.
- [ ] Analytics page correctly pulls and groups data by category.
- [ ] Navigation to category detail list implemented.
