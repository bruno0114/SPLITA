# Debug Session: AI Import Transaction Persistence

**Started**: 2026-01-21 02:40 (Follow-up)
**Issue**: Massive AI import still failing despite Ultimate RLS Fix.

---

## Symptom

**When**: Confirming import of multiple transactions after successful Gemini scan.
**Expected**: Transactions appear in Personal Finance or Group view.
**Actual**: Gemini reads them ("Key validada"), but nothing hits the database "user account".

---

## Evidence Gathered

1. **User Action**: Applied `supabase_master_rls_fix.sql`, performed hard refresh.
2. **Current State**: 
   - Gemini scan works (extracted data exists).
   - Persistence loop in `ImportExpenses.tsx` executes.
   - User says "not importing to user account".
3. **Logic Audit**:
   - `ensureCategory` is `await`ed. If it throws, the loop continues (try/catch in `ensureCategory` but NOT in the main loop for the whole function unless caught).
   - `addPersonalTransaction` is called.
   - `personal_transactions` policy uses `FOR ALL ... USING`. 

---

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | `FOR ALL` policy lacks `WITH CHECK` for `INSERT` | 60% | UNTESTED |
| 2 | `addCategory` fails silently or throws and breaks the loop | 30% | UNTESTED |
| 3 | `auth.uid()` vs `user_id` type mismatch or value missing | 10% | UNTESTED |

---

## Attempts

### Attempt 4 - RLS Policy Hardening
**Testing**: H1 — `FOR ALL` policies with `USING` might not be robust enough for `INSERT`.
**Action**: Rewrote `supabase_master_rls_fix.sql` to use explicit `FOR SELECT`, `FOR INSERT`, `FOR UPDATE` policies with `WITH CHECK` clauses.
**Status**: COMPLETED - User to re-apply.

### Attempt 5 - Date Normalization & Loop Stabilization
**Testing**: H2/H6 — Invalid date formats or connection flooding could cause silent failures.
**Action**: 
1. Added `normalizeDate` helper to `ImportExpenses.tsx` to ensure `YYYY-MM-DD`.
2. Added 150ms `delay` between concurrent requests in the loop.
3. Added more robust error tracking in the UI.
**Status**: COMPLETED.
