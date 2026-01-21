# Debugging SPLITA Balance Issue

## Symptom
- Manual and AI-imported transactions do not appear in the Personal Finance dashboard.
- Balance remains at 0.
- `list_tables` shows 18 rows in `personal_transactions`, but UI shows nothing.

## Evidence Gathered
1.  **DB State**: `personal_transactions` table has 18 rows.
2.  **Profiles**: Backfilled profiles and added trigger. `profiles` has 5 rows.
3.  **Code**: `usePersonalTransactions` fetch logic uses `user.id` from `useAuth`.
4.  **RLS**: Policies exist for `SELECT`, `INSERT`, `UPDATE`, `DELETE` where `user_id = auth.uid()`.

## Hypotheses
1.  **H1: User ID Mismatch**: The `user.id` used for fetching is not the same as the one used for inserting or the one Postgres sees via `auth.uid()`.
2.  **H2: Swallowed Errors**: A silent error in the join query (`transaction_splits` join) is causing the whole fetch to fail or return empty.
3.  **H3: Date Conversions**: Transactions are being inserted with dates that are being filtered out or not parsed correctly by the frontend.
4.  **H4: Pagination Logic**: `offsetRef.current` might be initialized or updated incorrectly, causing the first page to be empty.

## Attempts
### Attempt 1: Diagnostics and Error Visibility
- Improved logging in `usePersonalTransactions.ts`.
- Fixed structural error: Profile missing for some users.
- Re-aligned RLS policies.
- **Status**: Failed. User still sees 0.

### Attempt 2: Isolation and Visibility
- **Modified**: `usePersonalTransactions.ts` to isolate the `transaction_splits` join. If that join fails (due to RLS or schema), it no longer stops personal transactions from loading.
- **Modified**: `PersonalFinance.tsx` to actually DISPLAY the error message.
- **Action**: Added more detailed logs showing the `User ID` being queried.
- **Result**: PENDING (Waiting for user feedback).

## Latest Findings
- `list_tables` confirmed 18 rows exist in `personal_transactions`.
- If the user sees nothing, and there's no visible error, then the `SELECT` is returning 0 rows for that specific `user_id`.

## New Hypothesis: H5
The `user_id` being stored in Postgres is captured from a field that differs from the one `useAuth` returns in the frontend (e.g., `sub` vs `id`), although Supabase usually merges them.

## Verification Required
1.  Check the console log: `[usePersonalTransactions] Fetching for User ID: ...`
2.  Check if an error box appears in the UI.
