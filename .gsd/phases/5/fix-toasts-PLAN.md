---
phase: 5
plan: fix-notifications-toast
wave: 1
gap_closure: true
---

# Fix Plan: Notification Toast System

## Problem
No visual feedback for CRUD operations (success/error).

## Tasks

<task type="auto">
  <name>Implement Toast Context/Hook</name>
  <files>
    src/context/ToastContext.tsx
    src/hooks/useToast.ts
  </files>
  <action>
    - Create a branded, glassmorphism toast system.
    - Support `success`, `error`, `info`.
    - Localization: `es-AR`.
  </action>
  <verify>Check component code and styling.</verify>
  <done>Toast system is available globally.</done>
</task>

<task type="auto">
  <name>Integrate Toasts in Groups & Import</name>
  <files>
    src/features/groups/hooks/useGroups.ts
    src/features/expenses/pages/ImportExpenses.tsx
  </files>
  <action>
    - Trigger toasts on:
      - Group creation/update/deletion.
      - Expense import success/partial fail.
  </action>
  <verify>Check usage of useToast in these files.</verify>
  <done>Action items provide visual feedback.</done>
</task>
