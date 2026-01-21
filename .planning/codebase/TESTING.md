# Testing Patterns

**Analysis Date:** 2026-01-21

## Test Framework

**Runner:**
- Not configured - No test framework detected in `package.json`
- No vitest, jest, mocha, or testing library dependencies

**Assertion Library:**
- None installed

**Run Commands:**
- Testing commands not available in current setup
- `package.json` contains only: `dev`, `build`, `preview` scripts

## Test File Organization

**Location:**
- No test files found in codebase
- 0 `.test.*` or `.spec.*` files across entire `src/` directory
- Testing infrastructure not present

**Naming:**
- Not applicable - no test files

**Structure:**
- Not applicable - no test files

## Test Structure

**Suite Organization:**
- Not applicable - testing not implemented

**Patterns:**
- Not applicable - testing not implemented

## Mocking

**Framework:**
- Not applicable - no testing infrastructure

**Patterns:**
- Not applicable - testing not implemented

**What to Mock:**
- Not applicable - testing not implemented

**What NOT to Mock:**
- Not applicable - testing not implemented

## Fixtures and Factories

**Test Data:**
- Not applicable - no test fixtures created
- Sample data exists in services (e.g., fallback model lists in `src/services/ai.ts`)

**Location:**
- Not applicable - no dedicated test data directory

## Coverage

**Requirements:** Not enforced

**View Coverage:**
- No coverage tools installed

## Test Types

**Unit Tests:**
- Not implemented
- Best candidates for future unit testing:
  - `src/lib/expert-math.ts` - Pure functions for debt simplification and projections
  - `src/services/ai.ts` - Model selection and validation logic
  - `src/lib/constants.ts` - Static values and calculations
  - Custom hooks: `useTransactions`, `usePersonalTransactions`, `useCategories`

**Integration Tests:**
- Not implemented
- Future candidates would test Supabase interactions (authentication, data fetching, mutations)

**E2E Tests:**
- Not implemented

## Common Patterns

**Async Testing:**
- Not applicable - no test framework

**Error Testing:**
- Not applicable - no test framework

## Manual Testing Observations

**Current Error Handling:**
- Errors logged to console with service prefixes
- State-based error tracking in custom hooks (`error` state)
- User-facing errors handled via toast notifications (`useToast()`)
- API errors from Supabase destructured and caught: `const { data, error } = await supabase...`

**Validation in Code:**
- Input validation in custom hooks (e.g., checking `!groupId || !user` before fetching)
- Supabase RLS policies provide database-level validation
- Form validation in modal components (`TransactionModal.tsx`, `CategoryManagerModal.tsx`)

**Debugging Capabilities:**
- Console logging throughout services and hooks with prefixed messages
- No debug mode or verbose logging flag
- localStorage inspection for session/state debugging

## Future Testing Strategy

**Priority Areas:**
1. **Pure utility functions** (`src/lib/expert-math.ts`, `src/lib/dolar-api.ts`)
   - High value, easy to test, no dependencies
   - Current state: Critical debt simplification logic untested

2. **Custom hooks** (`src/features/*/hooks/*.ts`)
   - Medium value, requires testing library setup
   - Current risk: Hook logic bugs difficult to catch without automated tests

3. **API/Service layer** (`src/services/ai.ts`, Supabase interactions)
   - High value, medium complexity
   - Current state: AI service heavily relied upon, no validation coverage

4. **Components** (lower priority)
   - Render testing less critical for this app
   - Focus first on logic layer, then component integration

**Recommended Setup:**
- Framework: Vitest (Vite-native, fast, React compatible)
- Testing Library: @testing-library/react for component tests
- Mocking: MSW for API mocking, Vitest mocks for module mocking
- Coverage target: 60%+ for critical paths (business logic first, UI second)

---

*Testing analysis: 2026-01-21*
