---
phase: 7
plan: 1
wave: 1
---

# Plan 7.1: AI Import v2 (FX & Selection) (P1/P2)

## Objective
Upgrade the AI import workflow to support itemized acceptance and multi-currency conversion (FX).

## Context
- src/features/expenses/pages/ImportExpenses.tsx
- src/services/ai.ts
- Supabase 'transactions' table (for metadata)

## Tasks

<task type="auto">
  <name>Per-item Toggle Acceptance</name>
  <files>src/features/expenses/pages/ImportExpenses.tsx</files>
  <action>
    - In the Review step, add a checkbox/toggle for each detected item.
    - Default all to checked.
    - Update `handleConfirmImport` to only process items that are checked.
    - Ensure the "Total" display updates dynamically as items are toggled.
  </action>
  <verify>Verification of selective import functionality.</verify>
  <done>Users can exclude specific lines from an AI scan before saving.</done>
</task>

<task type="auto">
  <name>Currency Detection & FX Conversion</name>
  <files>src/services/ai.ts,src/features/expenses/pages/ImportExpenses.tsx</files>
  <action>
    - Update AI prompt to detect currency (e.g., USD, ARS, EUR) per item.
    - If a non-ARS currency is detected, show a "Confirmar Cambio" modal/section in the UI.
    - Ask the user for the exchange rate (suggest the current global app rate).
    - Store conversion metadata: `original_amount`, `original_currency`, `exchange_rate`. (Update DB schema via migration).
    - Save the final `amount` in ARS (converted).
  </action>
  <verify>Test scan with a USD receipt and verify conversion to ARS in the DB records.</verify>
  <done>AI correctly detects foreign currencies and prompts for conversion before import.</done>
</task>

## Success Criteria
- [ ] Users can cherry-pick which scanned items to save.
- [ ] Foreign currency expenses are converted to ARS during the review step.
- [ ] Conversion metadata is preserved for auditing.
