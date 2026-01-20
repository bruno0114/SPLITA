# Coding Conventions

**Analysis Date:** 2026-01-20

## Naming Patterns

**Files:**
- React components: PascalCase.tsx (e.g., `PersonalFinance.tsx`, `GroupDetails.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`, `useGroups.ts`, `useTransactions.ts`)
- Context files: PascalCase with `Context` suffix (e.g., `AuthContext.tsx`, `ToastContext.tsx`)
- Utility files: kebab-case (e.g., `image-utils.ts`, `constants.ts`)
- Service files: camelCase (e.g., `ai.ts`, `supabase.ts`)
- Type definition files: `index.ts` in `types/` directory

**Functions:**
- React components: PascalCase function declarations
  ```typescript
  const PersonalFinance: React.FC = () => { ... }
  ```
- Hooks: camelCase with `use` prefix
  ```typescript
  export const useAuth = () => { ... }
  export const useGroups = () => { ... }
  ```
- Helper functions: camelCase
  ```typescript
  const formatCurrency = (val: number) => ...
  const getAppRoute = (pathname: string): AppRoute => ...
  ```
- Event handlers: camelCase with `handle` prefix
  ```typescript
  const handleSave = async () => { ... }
  const handleDelete = async (id: string) => { ... }
  const handleNavigate = (route: AppRoute) => { ... }
  ```

**Variables:**
- State variables: camelCase
  ```typescript
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  ```
- Constants: UPPER_SNAKE_CASE for config objects
  ```typescript
  export const CATEGORY_CONFIG: Record<string, ...> = { ... }
  export const MOCK_TRANSACTIONS: Transaction[] = [ ... ]
  ```

**Types/Interfaces:**
- Interfaces: PascalCase with descriptive names
  ```typescript
  interface HeaderProps { ... }
  interface GroupsProps { ... }
  interface PersonalTransaction { ... }
  ```
- Enums: PascalCase with UPPER_SNAKE_CASE values
  ```typescript
  export enum AppRoute {
    ONBOARDING = 'onboarding',
    LOGIN = 'login',
    DASHBOARD_PERSONAL = 'dashboard_personal',
  }
  ```
- Type aliases: PascalCase
  ```typescript
  export type Theme = 'light' | 'dark' | 'system';
  export type Currency = 'ARS' | 'USD';
  export type ToastType = 'success' | 'error' | 'info' | 'loading';
  ```

## Code Style

**Formatting:**
- No explicit Prettier or ESLint configuration detected in project root
- Indentation: 4 spaces (observed in most files)
- Semicolons: Used consistently
- Quotes: Single quotes for strings
- Trailing commas: Used in multi-line arrays/objects

**TypeScript:**
- Strict mode not enabled (no `strict: true` in tsconfig)
- Target: ES2022
- Module: ESNext
- JSX: react-jsx
- Path aliases: `@/*` maps to `./src/*`

## Import Organization

**Order:**
1. React and React-related imports
   ```typescript
   import React, { useState, useEffect, useCallback } from 'react';
   ```
2. Third-party libraries (react-router-dom, lucide-react, supabase)
   ```typescript
   import { Routes, Route, Navigate } from 'react-router-dom';
   import { Plus, ArrowDown, Loader2 } from 'lucide-react';
   ```
3. Internal absolute imports using `@/` alias
   ```typescript
   import { AppRoute, Theme, Currency } from '@/types/index';
   import { supabase } from '@/lib/supabase';
   import { useAuth } from '@/features/auth/hooks/useAuth';
   ```
4. Relative imports (when within same feature)
   ```typescript
   import { usePersonalTransactions } from '../hooks/usePersonalTransactions';
   ```

**Path Aliases:**
- `@/*` -> `./src/*` (configured in `tsconfig.json` and `vite.config.ts`)

## Error Handling

**Patterns:**
- Try-catch blocks with error state management in hooks
  ```typescript
  try {
    const { data, error } = await supabase.from('...').select('...');
    if (error) throw error;
    // success handling
  } catch (err: any) {
    console.error('[useGroups] Error:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
  ```

- Return objects with error property from async operations
  ```typescript
  const createGroup = async (name: string, type: string) => {
    if (!user) return { error: 'No authenticated user' };
    try {
      // ... operation
      return { data: groupData, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };
  ```

- Toast notifications for user feedback
  ```typescript
  showToast('Grupo creado con exito', 'success');
  showToast(err.message || 'Error al crear el grupo', 'error');
  ```

- Supabase error pattern: check for error property in response
  ```typescript
  const { data, error } = await supabase.auth.signInWithPassword({ ... });
  if (error) throw error;
  ```

## Logging

**Framework:** Console (native browser console)

**Patterns:**
- Prefix logs with component/hook name in brackets
  ```typescript
  console.log('[useGroups] Group created:', groupData);
  console.error('[useGroups] Create group error:', groupError);
  console.warn('[AI Service] Smoke test failed for ${modelName}:', error);
  ```
- Use appropriate console methods:
  - `console.log()` for success/info
  - `console.error()` for errors
  - `console.warn()` for warnings

## Comments

**When to Comment:**
- Complex business logic explanations
  ```typescript
  // Optimistically remove from local state FIRST
  setGroups(prev => prev.filter(g => g.id !== id));
  ```
- TODO/placeholder markers
  ```typescript
  // Pivot calculation to be implemented later
  userBalance: 0,
  ```
- Configuration explanations
  ```typescript
  // Use string concatenation for className to avoid template literal issues in tool writing
  ```

**JSDoc/TSDoc:**
- Used for AI service functions with multi-line documentation
  ```typescript
  /**
   * Service to extract expenses from images/PDFs using Gemini.
   * Uses dynamic model selection to avoid 404 errors.
   */
  export const extractExpensesFromImages = async (...) => { ... }
  ```

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Extract sub-components within the same file for related UI (e.g., `GroupCard`, `CreateGroupModal`, `TransactionCard`)

**Parameters:**
- Use object destructuring for props
  ```typescript
  const Header: React.FC<HeaderProps> = ({ title, currentTheme, onThemeChange, ... }) => {
  ```
- Use data objects for multi-parameter operations
  ```typescript
  const addTransaction = async (data: {
    title: string;
    amount: number;
    category?: string;
    type: 'income' | 'expense';
  }) => { ... }
  ```

**Return Values:**
- Hooks return objects with state and actions
  ```typescript
  return {
    groups,
    loading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    refreshGroups: fetchGroups
  };
  ```
- Async operations return `{ data, error }` pattern
  ```typescript
  return { data: groupData, error: null };
  return { data: null, error: err.message };
  ```

## Module Design

**Exports:**
- Named exports for hooks, utilities, and types
  ```typescript
  export const useAuth = () => { ... }
  export const supabase = createClient(...);
  export interface User { ... }
  ```
- Default exports for page components
  ```typescript
  export default PersonalFinance;
  export default Groups;
  export default Header;
  ```

**Barrel Files:**
- Types barrel: `src/types/index.ts` exports all shared types
- No barrel files for features (import directly from specific files)

## Component Patterns

**Functional Components with TypeScript:**
```typescript
const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // hooks
  const [state, setState] = useState<Type>(initialValue);

  // handlers
  const handleAction = async () => { ... };

  // render
  return ( ... );
};
```

**State Management:**
- Local state with `useState` for UI state
- Context for global state (Auth, Toast)
- Custom hooks for data fetching and business logic

**Conditional Rendering:**
```typescript
if (loading) {
  return <Loader2 className="animate-spin" />;
}

{condition && <Component />}

{condition ? <ComponentA /> : <ComponentB />}
```

## Styling Conventions

**Tailwind CSS:**
- Use utility classes directly in JSX
- Use template literals for conditional classes
  ```typescript
  className={`base-classes ${condition ? 'active-classes' : 'inactive-classes'}`}
  ```
- Custom CSS variables for theming (e.g., `bg-background`, `bg-surface`, `text-primary`)
- Glass morphism pattern: `glass-panel` class with backdrop blur

**Icon Usage:**
- Lucide React icons throughout
- Consistent sizing: `w-4 h-4`, `w-5 h-5`, `w-6 h-6`
- Color with Tailwind text utilities

---

*Convention analysis: 2026-01-20*
