# Phase 6 Research

## codebase Analysis

### 1. Navigation
- **Current State:**
  - `Sidebar.tsx`: Handles desktop nav. Logic for active state uses `currentRoute` passed from `App.tsx`.
  - `Header.tsx`: Handles mobile menu. Logic for Breadcrumbs.
- **Issues:**
  - Logout button is inside `Sidebar` footer, which hides (`opacity: 0`) when collapsed.
  - No Logout button in `Header` desktop view (only Bell, Theme, Currency).
  - Active states depend on `App.tsx`'s `getAppRoute`. Nested Group routes (`/groups/:id`) map to `DASHBOARD_GROUPS`, which correctly highlights "Mis Grupos".
- **Refinement:**
  - Add `LogOut` button to `Header.tsx` (desktop only, to avoid redundancy in mobile menu which already has it).
  - Ensure `App.tsx` logic remains robust for new `/categories` routes.

### 2. Categories & Analytics
- **Data Models:**
  - **Personal:** `personal_transactions` table (via `usePersonalTransactions`). Interface `PersonalTransaction`.
  - **Groups:** `transactions` table (via `useTransactions` per group). Interface `Transaction`.
  - **Divergence:** Data models are slightly different (e.g. `splitWith` vs no split).
- **Categories:**
  - No centralized enum. `Transaction` uses plain string.
  - `MOCK_TRANSACTIONS` use: 'Compras', 'Supermercado', 'Gastronomía', 'Servicios', 'Transporte'.
- **Strategy:**
  - **Centralize Categories:** Create `CATEGORY_CONFIG` in `lib/constants.ts` mapping slugs to Label/Icon/Color.
  - **Context Switching:**
    - Analytics page will have a "Scope" selector: "Personal" (default) or "Group: [Name]".
    - Reuse existing hooks (`usePersonalTransactions`, `useTransactions`).
    - Create a generic `useCategoryStats` hook that accepts a list of standardized transaction objects and returns aggregation.
  - **Routing:**
    - `/categories` -> Overview
    - `/categories/:id` -> Detail (filtered list)

### 3. Missing Infrastructure
- Need `Categories.tsx` page.
- Need `CategoryDetail.tsx` page.
- Need generic `TransactionList` component? (We have `TransactionCard` in Personal and `GroupDetails` has its own list. Might need to DRY this or just create a new `AnalyticsTransactionCard` to adapt to both).
- **Decision:** To avoid "broad refactors", we will adapt the data to a common interface inside the Analytics page and use a unified view there.
