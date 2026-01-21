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

### Attempt 3: Structural Fixes and Global Data
- **Fixed**: `usePersonalTransactions.ts` was attempting to query a `type` column in the `transactions` table that doesn't exist. This caused group splits to be excluded from the summary.
- **Fixed**: `PersonalFinance.tsx` was using `transactions.length` (paginated to 20) instead of a total count.
- **Fixed**: `Categories.tsx` was also using the paginated `transactions` list, causing a mismatch in total spent.
- **Status**: VERIFIED (Logic corrected, waiting for user UI check).

## Resolution
1.  **Counter**: Now uses `summary.totalCount` (from total filtered data).
2.  **Categories**: Now uses `fullTransactions` (complete historical set).
3.  **Group Stats**: Removed the error-inducing `type` column from the join query. Group splits now correctly feed into the personal dashboard.
