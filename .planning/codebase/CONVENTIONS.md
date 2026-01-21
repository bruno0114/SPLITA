# Coding Conventions

**Analysis Date:** 2026-01-21

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` (e.g., `TransactionCard.tsx`, `PersonalFinance.tsx`)
- Custom hooks: `camelCase.ts` prefixed with `use` (e.g., `useTransactions.ts`, `usePersonalTransactions.ts`)
- Services/utilities: `camelCase.ts` (e.g., `personality.ts`, `ai.ts`, `dolar-api.ts`)
- Type/interface files: `index.ts` (centralized in `src/types/index.ts`)
- Context providers: `PascalCase.tsx` (e.g., `AuthContext.tsx`, `GroupsContext.tsx`)

**Functions:**
- Exported functions use camelCase (e.g., `useAuth`, `useTransactions`, `getArgentineInsight`)
- Event handlers prefixed with `handle` (e.g., `handleEdit`, `handleDeleteClick`, `handleConfirmDelete`, `handleNavigate`)
- Getter/finder functions use `get` prefix (e.g., `getRouteTitle`, `getBalanceChange`, `getArgentineInsight`)
- Async functions return Promises (e.g., `signInWithGoogle`, `fetchTransactions`)

**Variables:**
- State variables use camelCase (e.g., `isSidebarCollapsed`, `isFilterOpen`, `selectedGroupId`, `deleteConfirm`)
- Boolean flags prefixed with `is`, `has`, `can`, `should` (e.g., `isSelected`, `hasMore`, `canDelete`, `shouldRefresh`)
- Temporary/loop variables use single letter or descriptive camelCase (e.g., `i`, `j`, `debtor`, `creditor`)
- Context values suffixed with `Context` (e.g., `AuthContext`, `GroupsContext`)

**Types:**
- Interfaces use PascalCase (e.g., `User`, `Transaction`, `PersonalTransaction`, `Category`, `Group`)
- Union/discriminated types use UPPERCASE or PascalCase (e.g., `Theme`, `Currency`, `AIErrorCode`)
- Enum names use PascalCase (e.g., `AppRoute`)
- Interface properties use camelCase (e.g., `user_id`, `full_name`, `avatar_url` for DB fields; `userId`, `fullName` for JS objects)

## Code Style

**Formatting:**
- No explicit formatter configured (no .prettierrc)
- Indentation: 4 spaces observed in most files (React components)
- Line length: No strict limit enforced
- Quotes: Single quotes used consistently in imports and strings
- Semicolons: Used at end of statements

**Linting:**
- No explicit linting configuration found (no .eslintrc)
- TypeScript strict mode enabled via `tsconfig.json`
- Import organization loosely observed but not enforced

## Import Organization

**Order:**
1. React and third-party libraries (`react`, `react-dom`, `react-router-dom`, `framer-motion`)
2. SDK imports (`@google/genai`, `@supabase/supabase-js`)
3. UI libraries (`lucide-react`)
4. Local path aliases (`@/types`, `@/lib`, `@/features`, `@/components`, `@/context`, `@/services`)
5. Relative imports (same directory)

**Path Aliases:**
- `@/*` resolves to `./src/*` (configured in `tsconfig.json`)
- All imports use absolute paths with `@/` prefix rather than relative paths
- Example: `import { useAuth } from '@/features/auth/hooks/useAuth'`

## Error Handling

**Patterns:**
- Try-catch blocks used for async operations and API calls
- Errors destructured from Supabase responses: `const { data, error } = await supabase...`
- Throws or returns error objects in custom hooks
- Examples from codebase (`src/features/expenses/hooks/useTransactions.ts`):
  ```typescript
  try {
      const { data, error } = await supabase.from('transactions').select(...)
      if (error) throw error;
      // Process data
  } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
  } finally {
      setLoading(false);
  }
  ```
- State-based error tracking: `error` state in hooks (e.g., `[error, setError]`)
- Toast notifications for user-facing errors via `useToast()` hook
- Console logging for debugging, not production errors

## Logging

**Framework:** `console` (no dedicated logger)

**Patterns:**
- `console.log()` for informational messages, often with service prefixes
- `console.warn()` for potential issues (e.g., fallback behaviors)
- `console.error()` for actual errors and failures
- Service-based prefixes: `[AI Service]`, `[DolarAPI]`, `[useCategories]`, `[GroupsContext]`
- Example from `src/services/ai.ts`:
  ```typescript
  console.log("[AI Service] Available models:", availableModels);
  console.warn("[AI Service] Could not list models, using fallback list.", error);
  console.error("[AI Service] Error analyzing health:", error);
  ```
- Minimal logging in components, more in services and hooks

## Comments

**When to Comment:**
- Algorithm explanations (e.g., in `src/lib/expert-math.ts` explaining debt simplification)
- Complex logic or non-obvious decisions
- TODO/FIXME markers sparingly (minimal use in codebase)
- Section dividers for component layout blocks (e.g., `/* Mobile Menu Trigger */`)

**JSDoc/TSDoc:**
- Used selectively in services and utility functions
- Function descriptions at module level (e.g., `src/services/ai.ts`, `src/lib/expert-math.ts`)
- Parameter and return type documentation minimal
- Example from `src/lib/expert-math.ts`:
  ```typescript
  /**
   * Simplifies debts between a group of people.
   * Reduces the total number of transactions needed to settle.
   */
  export const simplifyDebts = (balances: Record<string, number>, members: Member[]) => { ... }
  ```

## Function Design

**Size:**
- Functions range from 10-50 lines typically
- Larger files (400-1000 lines) are React pages, not single functions
- Utility functions kept compact (20-30 lines)
- Hooks may be longer due to state management and effects

**Parameters:**
- Destructured props in React components: `const Component: React.FC<Props> = ({ prop1, prop2 }) => { ... }`
- Options objects for optional parameters (e.g., `{ skipRefresh?: boolean }` in `addTransaction`)
- Single responsibility principle: functions accept related parameters only

**Return Values:**
- Hooks return objects with state and methods: `{ transactions, loading, error, addTransaction, deleteTransaction }`
- Async functions return typed responses: `{ data, error }`
- React components return JSX
- Utility functions return computed values (numbers, arrays, objects)

## Module Design

**Exports:**
- Named exports preferred for functions and types
- Default exports rare (only for React components as default when used alone)
- Example: `export const useAuth = () => { ... }` not `export default useAuth`
- Barrel files: Not heavily used; single-responsibility modules

**Barrel Files:**
- Central type barrel: `src/types/index.ts` exports all type definitions
- Services imported individually: `import { validateGeminiKey } from '@/services/ai'`
- Components imported directly: `import TransactionCard from '@/features/expenses/components/TransactionCard'`

---

*Convention analysis: 2026-01-21*
