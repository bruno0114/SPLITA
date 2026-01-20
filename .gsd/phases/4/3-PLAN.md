---
phase: 4
plan: 3
wave: 2
---

# Plan 4.3: Flexible Import Destinations (P1)

## Objective
Update the AI Import flow to allow users to save scanned expenses either to a specific Group or to their own Personal Finances. This completes the data integrity loop by ensuring expenses land in the correct bucket.

## Context
- src/features/expenses/pages/ImportExpenses.tsx
- src/features/dashboard/hooks/usePersonalTransactions.ts
- src/features/expenses/hooks/useTransactions.ts

## Tasks

<task type="auto">
  <name>Update Destination Selector</name>
  <files>src/features/expenses/pages/ImportExpenses.tsx</files>
  <action>
    - Add an "Asignar a..." dropdown or toggle in the Review stage.
    - Options: "Mis Finanzas Personales" (default) or "Un Grupo...".
    - If "Un Grupo" is selected, show the existing group dropdown.
    - If "Mis Finanzas" is selected, hide the group dropdown and set `selectedGroupId` to `personal`.
  </action>
  <verify>Visual verification of the new selection UI in the Review step.</verify>
  <done>User can switch between Personal and Group contexts during review.</done>
</task>

<task type="auto">
  <name>Implement Multi-Context Save Logic</name>
  <files>src/features/expenses/pages/ImportExpenses.tsx</files>
  <action>
    - Update `handleConfirmImport` to use its destination context.
    - If `selectedGroupId === 'personal'`, iterate and call `addPersonalTransaction`.
    - If `selectedGroupId` is a real ID, use `addGroupTransaction` (the existing `addTransaction`).
    - Handle success navigation (Personal -> Dashboard, Group -> Group View).
  </action>
  <verify>Functional test importing 1 ticket to Personal and 1 to a Group.</verify>
  <done>Scanned expenses are correctly persisted in either `personal_transactions` or `transactions` table based on selection.</done>
</task>

## Success Criteria
- [ ] Users can import expenses to their personal finance dashboard.
- [ ] Group splits are only applied when importing to a group.
- [ ] Success messages correctly indicate the destination of items.
