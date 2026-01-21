# Debug Session: AI Import Transaction Persistence

**Started**: 2026-01-21 01:46
**Issue**: Bulk AI import not saving transactions to database

---

## Symptom

**When**: After user uploads document, validates items, and confirms import
**Expected**: Transactions should be saved to `personal_transactions` or `transactions` table in Supabase
**Actual**: Success message appears, redirects to correct page, but NO transactions are saved

**User report**: "En versiones anteriores este error no ocurría y la importación parecía funcionar mejor"

---

## Evidence Gathered

### Code Review Findings

1. **Navigation bug was fixed** (lines 347-351 in ImportExpenses.tsx)
   - Was redirecting to wrong routes (`/dashboard` → `/`)
   - This could have hidden the issue before

2. **Import flow logic** (lines 296-343):
```javascript
if (selectedGroupId === 'personal') {
  for (const id of selectedIds) {
    const { error } = await addPersonalTransaction({...});
    if (!error) successCount++;
  }
}
```

3. **Success condition** (line 316):
   - Only increments `successCount` if `!error`
   - But doesn't log or handle when error exists

### Potential Issues

- ❓ No error handling within the loop
- ❓ No console logging to trace execution
- ❓ Silent failures possible if `addPersonalTransaction` returns error
- ❓ `successCount` might be 0 but success message still shows

---

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | Silent errors from `addPersonalTransaction` - errors not logged | 70% | TESTING |
| 2 | Success message shows even when `successCount === 0` | 20% | UNTESTED |
| 3 | Category creation fails and breaks transaction insert | 10% | UNTESTED |

---

## Debug Strategy

1. Add extensive console logging to trace:
   - What data is being sent
   - What errors are returned
   - What successCount ends up being
2. Add error display in UI
3. Test with actual import

---

## Attempts

### Attempt 1 - Add Debug Logging & Error Handling
**Testing**: H1 — Silent errors not being caught or logged
**Action**: Added comprehensive logging to `handleConfirmImport`:
- Log start of import process and selected destination
- Log each transaction being processed with full payload
- Log category creation/lookup
- Log success/failure for each transaction insert
- Track errors in array and display to user
- Show different messages based on: all success, partial success, or total failure

**Changes**:
1. Added `errors: string[]` array to track failures
2. Console.log at every critical step
3. Enhanced error handling with user-friendly messages
4. No longer shows "Éxito" if `successCount === 0`

**Build Status**: ✅ Compiled successfully

**Next**: User needs to test import flow and share console output

---

## Instructions for User

Por favor, probá la importación nuevamente y enviame **TODOS** los mensajes de consola que veas con el prefijo `[AI Import]`.

**Pasos**:
1. Abrí la consola del navegador (F12 → Console)
2. Subí un documento con varios ítems
3. Validá los movimientos
4. Seleccioná destino (Personal/Grupo)
5. Confirmá la importación
6. **Copiá y pegá TODOS los mensajes** que empiecen con `[AI Import]`

Los logs me dirán exactamente dónde está fallando el proceso.
