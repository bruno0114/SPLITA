# Plan: Fix Gemini 404 and Enhance Expense Extraction

## Objective
Resolve the 404 model error in the Import Expenses feature by utilizing the dynamic model selection service. Simultaneously, optimize the AI prompt to ensure all expenses in the provided documents are extracted thoroughly.

## Proposed Changes

### [Component] AI Service ([ai.ts](file:///Users/brunoaguilar/SPLITA-1/src/services/ai.ts))
- Move the expense extraction logic from the UI component to the centralized service.
- Implement `extractExpensesFromImages` which handles:
    - Dynamic model selection via `getEffectiveModel`.
    - Structured output (JSON schema) for consistent extraction.
    - Improved prompt to "list all expenses found in the documents".

### [Component] Import Expenses Page ([ImportExpenses.tsx](file:///Users/brunoaguilar/SPLITA-1/src/features/expenses/pages/ImportExpenses.tsx))
- [MODIFY] Replace local and hardcoded AI call logic with the new `extractExpensesFromImages` service.
- [MODIFY] Simplify the component by offloading the complex JSON schema and prompt to the service layer.

## Verification Plan

### Automated Verification
- Audit `ImportExpenses.tsx` to confirm the removal of hardcoded `gemini-1.5-flash`.
- Verify `ai.ts` includes the new `extractExpensesFromImages` function using dynamic model selection.

### Manual Verification
- User tests importing a receipt with multiple items to confirm the "list all" requirement.
- User confirms the 404 error is gone after setting their API key.
