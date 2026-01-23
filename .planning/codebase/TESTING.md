# Testing Patterns

**Analysis Date:** 2026-01-23

## Test Framework

**Runner:** Not detected

**Assertion Library:** Not detected

**Status:** No testing framework or test files found in `src/` directory. Project is not configured with Jest, Vitest, or similar.

**Run Commands:** Not applicable

## Test File Organization

**Location:** Not applicable - no tests present

**Naming:** Not applicable

**Structure:** Not applicable

## Test Coverage

**Requirements:** Not enforced

**Current State:** No test files exist in the codebase. Production code has no test coverage.

## Development Notes

**What Needs Testing:**

Based on codebase analysis, the following areas are most critical and should be targeted for first testing:

### High-Priority Test Targets

**1. Custom Hooks (`src/features/*/hooks/`)**
- `useTransactions.ts` (313 lines) - Critical CRUD operations on transactions
  - `fetchTransactions()` - data loading and transformation
  - `addTransaction()` - insert with splits logic
  - `updateTransaction()` - update and split refresh
  - `deleteTransaction()` / `deleteTransactions()` - permission checks
  - Return format consistency

- `useEconomicHealth.ts` (151 lines) - Financial score calculations
  - `monthlySummary` calculation (memoized)
  - Score formula and status mapping logic
  - AI advice fetching and caching
  - Edge cases (zero transactions, no income)

- `usePersonalTransactions.ts` (440 lines) - Personal finance data aggregation
  - Data fetching and filtering
  - Transaction categorization
  - Monthly/yearly summaries

- `useCategoryStats.ts` (83 lines) - Analytics aggregation
  - Category grouping logic
  - Percentage calculations
  - Pre-population of default categories

**2. Services (`src/services/` and `src/lib/`)**
- `ai.ts` (288 lines) - Gemini API integration
  - Model selection and fallback logic
  - API error handling
  - Prompt injection protection
  - Rate limiting and caching

- `personality.ts` - User personality classification
- `dolar-api.ts` - Exchange rate fetching and caching

**3. Context Providers (`src/context/`)**
- `AuthContext.tsx` - Auth state management
- `CurrencyContext.tsx` - Currency conversion logic
- `GroupsContext.tsx` - Group operations (join, leave, etc.)

**4. Components with Complex Logic**
- `ImportExpenses.tsx` (896 lines) - Receipt upload and AI extraction
- `GroupDetails.tsx` (1131 lines) - Group management UI
- `TransactionModal.tsx` (295 lines) - Form validation and submission

### Medium-Priority Test Targets

**1. Utility Functions**
- Date formatting functions (e.g., in `TransactionCard.tsx`)
- Currency conversion calculations
- Category mapping logic

**2. Type Definitions**
- Test that component props match type definitions
- Test interface serialization/deserialization

### Testing Strategy Recommendations

**Setup Required:**

1. Install testing framework (recommend Vitest for speed with Vite)
   ```bash
   npm install -D vitest @vitest/ui happy-dom @testing-library/react @testing-library/user-event
   ```

2. Create `vitest.config.ts`
   ```typescript
   import { defineConfig } from 'vitest/config'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     test: {
       globals: true,
       environment: 'happy-dom',
       coverage: { provider: 'v8', reporter: ['text', 'json', 'html'] }
     }
   })
   ```

3. Create test helper utilities
   - Mock Supabase client for all hook tests
   - Mock currency context for component tests
   - Mock router for navigation-dependent components

**Test File Locations:**
- Co-locate with source files: `useTransactions.test.ts` next to `useTransactions.ts`
- Component tests in same directory as component
- Shared test utilities in `src/__tests__/` or `src/test-utils/`

**Mock Strategy:**
- Mock Supabase client (`@supabase/supabase-js`) for all DB operations
- Mock Framer Motion animations for deterministic component tests
- Mock fetch calls for API services (dolar-api, AI services)
- Create factory functions for test data (transactions, users, groups)

**Critical Test Patterns Needed:**

1. **Hook Testing with Async Data:**
```typescript
// Pattern observed in useTransactions:
const { result } = renderHook(() => useTransactions('group-id'), {
  wrapper: ({ children }) => <TestProvider>{children}</TestProvider>
});
await waitFor(() => expect(result.current.loading).toBe(false));
expect(result.current.transactions).toBeDefined();
```

2. **Error Handling in Hooks:**
```typescript
// Test the { error: null } / { error: message } pattern
const { result } = renderHook(() => useTransactions());
act(() => result.current.addTransaction(...));
await waitFor(() => expect(result.current.error).toBe(null) || toBe(errorMessage));
```

3. **Memoization Testing:**
```typescript
// Verify useMemo dependencies in hooks like useEconomicHealth
const firstResult = result.current.data;
rerender(); // same props
const secondResult = result.current.data;
expect(firstResult).toBe(secondResult); // referential equality
```

**Coverage Goals:**
- Custom hooks: 100% (critical for reliability)
- Service functions: 100% (math, API logic)
- Components: 80%+ (focus on business logic, not presentation)
- Utilities: 100%

---

*Testing analysis: 2026-01-23*
