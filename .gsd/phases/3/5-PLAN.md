---
phase: 3
plan: 5
wave: 1
gap_closure: true
---

# Plan 3.5: UX Feedback & Error Unification

## Objective
Remove all browser `alert()` usage in `ImportExpenses.tsx` and ensure error messages are consistent with the `AISettings` design pattern.

## Context
- [ImportExpenses.tsx](file:///Users/brunoaguilar/SPLITA-1/src/features/expenses/pages/ImportExpenses.tsx)
- [AISettings.tsx](file:///Users/brunoaguilar/SPLITA-1/src/features/settings/components/AISettings.tsx)
- .gsd/phases/3/VERIFICATION.md (Gap 1 & 3)

## Tasks

<task type="auto">
  <name>Unify AI Error UI</name>
  <files>
    <file>/Users/brunoaguilar/SPLITA-1/src/features/expenses/pages/ImportExpenses.tsx</file>
  </files>
  <action>
    - Add `error` and `success` state variables to the component.
    - Implement an inline alert/banner component (or follow the JSX pattern from `AISettings.tsx`) to display these states.
    - Place the message area at the top of the "upload" and "review" views.
    - Localize all messages to es-AR.
  </action>
  <verify>Check component for new state and rendering logic.</verify>
  <done>Error/Success states are managed via local state, not side-effects like alerts.</done>
</task>

<task type="auto">
  <name>Remove Browser Alerts</name>
  <files>
    <file>/Users/brunoaguilar/SPLITA-1/src/features/expenses/pages/ImportExpenses.tsx</file>
  </files>
  <action>
    - Replace `alert()` calls on lines 169, 172, 205, and 230 with updates to the new `error`/`success` state.
    - Ensure `handleConfirmImport` shows success through a temporary banner before navigating back.
  </action>
  <verify>Grep for `alert(` in the file; it must return zero matches.</verify>
  <done>Zero browser alerts in the file.</done>
</task>

## Success Criteria
- [ ] No `alert()` calls remain in `ImportExpenses.tsx`.
- [ ] Error messages for AI failures match the wording and style of `AISettings.tsx`.
