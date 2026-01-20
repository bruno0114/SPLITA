# Implementation Plan - Phase 7: AI Import Evolution

Implement item-by-item selection, detecting installments/recurrence patterns, and handling multi-currency (USD) imports with manual exchange rate conversion.

## User Review Required

> [!IMPORTANT]
> This phase modifies the `transactions` and `personal_transactions` tables to store original currency data.
> The AI logic will now returned more detailed objects including metadata about installments and currency.

## Proposed Changes

### 1. Database Schema Update
Add support for multi-currency and recurrence markers to the transaction tables.

#### [MODIFY] Migration
- Add `original_amount` (numeric), `original_currency` (text), `exchange_rate` (numeric) to `transactions`.
- Add `original_amount` (numeric), `original_currency` (text), `exchange_rate` (numeric) to `personal_transactions`.
- Add `is_recurring` (boolean) and `recurring_pattern` (text) to both tables.

---

### 2. AI Service (Gemini)
Update the prompt and schema to extract more technical details from receipts.

#### [MODIFY] [ai.ts](file:///Users/brunoaguilar/SPLITA-1/src/services/ai.ts)
- Update prompt to detect:
    - Currency (USD vs ARS).
    - Installments (e.g., "1/3", "Cuota 1 de 6").
    - Recurrence keys ("mensual", "abono", "suscripción").
- Update output schema to include `currency`, `installments` (string), and `is_recurring_hint` (boolean).

---

### 3. Frontend Logic & Components
Enhance the import flow to be more granular.

#### [MODIFY] [ImportExpenses.tsx](file:///Users/brunoaguilar/SPLITA-1/src/features/expenses/pages/ImportExpenses.tsx)
- **Review Stage**: 
    - Add a toggle/checkbox for each detected item.
    - If `currency === 'USD'`, show an "Exchange Rate" input field.
    - Implement a "Mark as Recurring" toggle for each item.
    - Add "Split with..." dropdown/icons per item if a group is selected (or default to group members if selecting a group).
- **Save Stage**:
    - Update `handleConfirmImport` to filter by selected items.
    - Pass multi-currency metadata to the hooks.

---

### 4. Data Layer (Hooks)
Update hooks to persist the new metadata.

#### [MODIFY] [useTransactions.ts](file:///Users/brunoaguilar/SPLITA-1/src/features/expenses/hooks/useTransactions.ts)
- Update `addTransaction` to accept `original_amount`, `original_currency`, `exchange_rate`, `is_recurring`.

#### [MODIFY] [usePersonalTransactions.ts](file:///Users/brunoaguilar/SPLITA-1/src/features/dashboard/hooks/usePersonalTransactions.ts)
- Update `addTransaction` similarly.

## Verification Plan

### Manual Verification
1. **AI Scan**: Upload a receipt with USD or installments (simulated or real).
2. **Selection**: Toggle off some items and verify they are NOT imported.
3. **FX Handling**: Trigger USD detection and verify that changing the rate correctly calculates the final ARS amount.
4. **Persistence**: Verify in Supabase that `original_amount` and `exchange_rate` are populated for the new transactions.
5. **Recurrence**: Toggle "Recurring" on an item and check the `is_recurring` flag in DB.
