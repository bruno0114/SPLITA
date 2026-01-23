# Coding Conventions

**Analysis Date:** 2026-01-23

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `Sidebar.tsx`, `TransactionCard.tsx`)
- Custom hooks: camelCase with `use` prefix (e.g., `useTransactions.ts`, `useEconomicHealth.ts`)
- Services/utilities: camelCase (e.g., `ai.ts`, `dolar-api.ts`, `personality.ts`)
- Type definition file: `index.ts` (e.g., `src/types/index.ts`)
- Context files: PascalCase ending in `Context.tsx` (e.g., `AuthContext.tsx`, `CurrencyContext.tsx`)

**Functions:**
- Exported functions: camelCase (e.g., `getGeminiClient`, `fetchDolarRates`, `getDailyAdvice`)
- React component functions: PascalCase (e.g., `Sidebar`, `AnimatedPrice`, `NavItem`)
- Handler functions: `handle` + PascalCase (e.g., `handleConfirmJoin`, `handleNavigate`, `handleLogOut`)
- Callback functions: same pattern as handlers (e.g., `onNavigate`, `onLogout`, `onSelect`)

**Variables:**
- State variables: camelCase (e.g., `isCollapsed`, `inviteToJoin`, `aiInsights`)
- Constants: UPPER_SNAKE_CASE (e.g., `CATEGORY_CONFIG`, `EXTRACTION_PROMPT`)
- Boolean variables: prefix with `is` or `has` (e.g., `isPublicRoute`, `hasIncome`, `isRecurring`)
- Array/collection variables: plural form (e.g., `transactions`, `categories`, `insights`)

**Types:**
- Interfaces: PascalCase ending with `Props` for component props, or descriptive names (e.g., `SidebarProps`, `AnimatedPriceProps`, `EconomicHealthData`, `CurrencyContextType`)
- Enums: PascalCase (e.g., `AppRoute`)
- Type aliases: PascalCase (e.g., `Theme`, `Currency`)

## Code Style

**Formatting:**
- No explicit formatter configured (ESLint/Prettier not set up)
- Use 4-space indentation (observed in most files)
- Trailing commas in objects and arrays when multi-line
- Consistent use of single quotes for strings

**Linting:**
- No explicit linting configuration found
- TypeScript strict mode via `tsconfig.json` with `isolatedModules: true`

## Import Organization

**Order:**
1. React and built-in libraries (e.g., `import React from 'react'`)
2. Third-party packages (e.g., `framer-motion`, `lucide-react`, `react-router-dom`)
3. Type imports (e.g., `import { AppRoute, Theme } from '@/types/index'`)
4. Local feature/context imports (e.g., `import { useAuth } from '@/features/auth/hooks/useAuth'`)
5. Component imports (e.g., `import Sidebar from '@/components/layout/Sidebar'`)
6. Utility/service imports (e.g., `import { useCurrency } from '@/context/CurrencyContext'`)

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in `tsconfig.json`)
- Use `@/` for all local imports (not relative paths)
- Examples: `@/types/index`, `@/features/auth/hooks/useAuth`, `@/components/ui/AnimatedPrice`

## Error Handling

**Patterns:**
- Try-catch blocks with specific error logging
- Errors logged with context prefix (e.g., `console.error('[useTransactions] Delete error:', err)`)
- Return `{ error: null }` / `{ data: null, error: err.message }` pattern in hooks and services
- Supabase errors thrown and caught (e.g., `if (error) throw error`)
- Custom error codes in AI service (e.g., `API_KEY_MISSING`, `INVALID_KEY`, `RATE_LIMIT`)

**Example from `useTransactions.ts`:**
```typescript
try {
    const { data, error } = await supabase.from('transactions').select(...);
    if (error) throw error;
    setTransactions(validTransactions);
} catch (err: any) {
    console.error('Error fetching transactions:', err);
    setError(err.message);
} finally {
    setLoading(false);
}
```

## Logging

**Framework:** `console` object (no centralized logging service)

**Patterns:**
- `console.log()` for informational messages (e.g., sync success, auth flow events)
- `console.error()` for error messages with context prefix in brackets
- Log context prefixes: `[useTransactions]`, `[AUTH]`, `[GroupsContext]`, `[BulkActions]`, `[AI Service]`
- Verbose logging in development (e.g., available models list in `ai.ts`)

**Examples:**
```typescript
console.log("[AUTH] Login.tsx effect triggering onLogin");
console.error('[useTransactions] Delete error:', err);
console.warn("[AI Service] Could not list models, using fallback list.", error);
```

## Comments

**When to Comment:**
- Explain complex business logic (e.g., discount calculations, score formulas)
- Mark intentional workarounds or temporary solutions
- Clarify non-obvious conditional logic
- Document loop guards and state management patterns

**JSDoc/TSDoc:**
- Function interfaces documented with JSDoc (e.g., AI service functions)
- Not consistently applied across all functions
- Used for public APIs and service functions (e.g., `getGeminiClient`, `smokeTestModel`)

**Example from `ai.ts`:**
```typescript
/**
 * Returns a Gemini client using either a provided user key
 * or the default system key from environment variables.
 */
export const getGeminiClient = (userKey?: string | null) => {
```

## Function Design

**Size:**
- Large functions common (300+ lines observed in pages like `ImportExpenses.tsx`, `GroupDetails.tsx`)
- Recommendation: Keep under 200 lines where possible; break into sub-functions for complex logic
- Custom hooks can be larger due to state management (e.g., `useTransactions.ts` is 313 lines)

**Parameters:**
- Prefer destructured object parameters in hooks and context providers
- Component props passed as single `Props` object interface
- Optional parameters use `?` and provide defaults
- Avoid `any` type; use specific types or `unknown` for flexible inputs

**Return Values:**
- Hooks return object with state and actions (e.g., `{ data, loading, error, refreshAdvice }`)
- Service functions return result objects (e.g., `{ data: txData, error: null }`)
- Context hooks throw errors if used outside provider (e.g., `useCurrency`, `useAuthContext`)

## Module Design

**Exports:**
- Default exports for components (e.g., `export default Sidebar`)
- Named exports for hooks (e.g., `export const useTransactions = ...`)
- Named exports for types and enums (e.g., `export interface EconomicHealthData`, `export enum AppRoute`)
- Re-export types from single index file (`src/types/index.ts`)

**Barrel Files:**
- `src/types/index.ts` is main barrel file for all type definitions
- Not extensively used elsewhere; imports are path-specific
- Examples: import types and hooks directly from their source files

---

*Convention analysis: 2026-01-23*
