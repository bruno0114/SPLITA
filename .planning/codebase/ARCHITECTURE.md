# Architecture

**Analysis Date:** 2026-01-23

## Pattern Overview

**Overall:** Layered SPA with React Context + Custom Hooks pattern

**Key Characteristics:**
- Client-side React SPA using React Router for navigation
- State management via Context API combined with custom data hooks
- Supabase as backend (auth, database, RPC)
- Feature-based folder organization with co-located hooks and pages
- Separates concerns between presentational components, data hooks, and context providers

## Layers

**Presentation Layer:**
- Purpose: UI components and page-level orchestration
- Location: `src/components/`, `src/features/*/pages/`, `src/features/*/components/`
- Contains: React components (TSX), styled with Tailwind CSS and Framer Motion
- Depends on: Custom hooks, Context consumers, UI library (lucide-react, recharts)
- Used by: App router, users interacting with pages

**State Management Layer:**
- Purpose: Global state and data flow orchestration
- Location: `src/context/`, `src/features/*/context/`
- Contains: Context providers (Auth, Groups, Currency, Toast) that manage global state
- Depends on: Supabase SDK, custom hooks, localStorage for persistence
- Used by: All pages and components via hooks

**Data Layer (Hooks):**
- Purpose: Server communication and data caching/transformation
- Location: `src/features/*/hooks/`, `src/hooks/`
- Contains: Custom React hooks (useAuth, useTransactions, usePersonalTransactions, useCategories, etc.)
- Depends on: Supabase client, useState/useEffect, external APIs
- Used by: Components and context providers for fetching/updating data

**Infrastructure Layer:**
- Purpose: Low-level utilities and service integrations
- Location: `src/lib/`, `src/services/`
- Contains: Supabase client configuration, AI service (Google Gemini), utility functions, currency API integration
- Depends on: External SDKs (Supabase, Google GenAI, API clients)
- Used by: Hooks and data transformation code

## Data Flow

**Authentication Flow:**

1. App boots → `AuthProvider` in `src/features/auth/context/AuthContext.tsx` initializes
2. AuthContext checks `supabase.auth.getSession()` and subscribes to auth state changes
3. `useAuth()` hook in `src/features/auth/hooks/useAuth.ts` exposes user state + auth actions
4. `ProtectedRoute` in `src/components/layout/ProtectedRoute.tsx` guards protected pages
5. Login/Onboarding pages trigger `signInWithGoogle`, `signUp`, `signInWithPassword` via useAuth
6. Token stored in Supabase session, automatically included in all subsequent requests

**Transaction Fetch Flow:**

1. Page component (e.g., GroupDetails) calls `useTransactions(groupId)`
2. Hook initializes with state: `[transactions, loading, error]`
3. useEffect triggers `fetchTransactions()` callback when groupId changes
4. Hook queries Supabase: `transactions` → `payer` profile, `transaction_splits` with user profiles
5. Transforms DB rows to `Transaction[]` type
6. Component consumes `transactions` and renders TransactionCard components
7. User action (add/edit/delete) calls hook's `addTransaction()`, `updateTransaction()`, or `deleteTransaction()`
8. Hook sends mutation to Supabase, then calls `fetchTransactions()` to refresh UI
9. Toast notifications show success/error via `useToast()` injected from `ToastProvider`

**Group Management Flow:**

1. `GroupsProvider` in `src/context/GroupsContext.tsx` provides global groups state
2. useEffect fetches user's group memberships from `group_members` table
3. Joins with `groups` table to get group details
4. Components access groups via `useGroups()` hook
5. Actions like `createGroup()`, `joinGroup()`, `deleteGroup()` update Supabase
6. Context refreshes local state and notifies via toast
7. Invite flow: User receives invite code → stored in localStorage → `PremiumConfirmModal` displays join prompt → `joinGroup()` RPC called

**Personal Finance Flow:**

1. `PersonalFinance` page component calls `usePersonalTransactions()`
2. Hook fetches user's personal transactions + calculates summary (income/expenses/balance)
3. Implements pagination with `loadMore()` - fetches 20 at a time
4. Filters support date ranges and categories
5. Components show filtered transactions, summary card, charts
6. User adds transaction → `addTransaction()` → creates `personal_transactions` record
7. Expense updates trigger chart recalculation and summary refresh

**State Management:**

- **Context-based state:** Auth (user, session), Groups (list, create/update/delete), Currency (exchange rates, selected currency), Toast (notifications)
- **Component-local state:** Modals, filters, selected items, pagination offsets
- **Persistence:** localStorage for theme, currency preference, rate source, onboarding redirect path
- **Real-time updates:** useEffect dependencies trigger refetches, some hooks subscribe to Supabase channels (e.g., categories)

## Key Abstractions

**Custom Data Hooks (useQuery pattern):**
- Purpose: Encapsulate Supabase queries and transformations
- Examples: `useAuth`, `useTransactions`, `usePersonalTransactions`, `useCategories`, `useGroups`, `useProfile`, `useEconomicHealth`
- Pattern: Return `{ data, loading, error, actions... }`
- Used by: Pages and components to read data and trigger mutations

**Context Providers (State Containers):**
- Purpose: Share global state without prop drilling
- Examples: `AuthProvider`, `GroupsProvider`, `CurrencyProvider`, `ToastProvider`
- Pattern: Create context → Provider wraps app → useXyz hook to consume
- Benefits: Persist state across page transitions, enable cross-feature communication

**Supabase RPC Wrapper:**
- Purpose: Encapsulate backend logic and security definer functions
- Examples: `get_group_details_by_code()`, `join_group_by_code()`
- Called from: `GroupsContext` hooks
- Security: RPC uses PostgreSQL definer to enforce RLS even for code that bypasses row-level policies

**Transform Functions:**
- Purpose: Map database rows to application types
- Located in: Hook files (inline transformations)
- Example: `useTransactions` maps `{ payer: {...}, splits: [...] }` to `Transaction` type

## Entry Points

**Application Entry:**
- Location: `src/index.tsx`
- Responsibilities: Mount React app, wrap with provider stack (Auth → Toast → Router → Groups → Currency)
- Triggers: Initial app load

**Main App Router:**
- Location: `src/App.tsx`
- Triggers: After AuthProvider hydrates user state
- Responsibilities:
  - Render public routes (Login, Onboarding, Join) vs. protected routes
  - Manage sidebar/header/bottom nav layout
  - Handle theme switching (light/dark/system)
  - Handle invite/deeplink redirects from localStorage
  - Sync onboarding data to Supabase on first login

**Route Configuration:**
- `AppRoute` enum in `src/types/index.ts` defines all route paths
- Routes registered in App.tsx `<Routes>` component
- Protected routes wrapped in `<ProtectedRoute>` component

**Feature Entry Points (Pages):**
- `PersonalFinance` - `src/features/dashboard/pages/PersonalFinance.tsx`
- `Groups` - `src/features/groups/pages/Groups.tsx`
- `GroupDetails` - `src/features/groups/pages/GroupDetails.tsx`
- `ImportExpenses` - `src/features/expenses/pages/ImportExpenses.tsx`
- `Categories` - `src/features/analytics/pages/Categories.tsx`
- `Settings` - `src/features/settings/pages/Settings.tsx`

## Error Handling

**Strategy:** Try-catch in data hooks, error state propagated to components, toast notifications for user feedback

**Patterns:**

```typescript
// Hook pattern: capture error, expose as state
const hook = async () => {
  try {
    const { data, error } = await supabase...
    if (error) throw error;
    setData(data);
  } catch (err) {
    console.error('[Hook name] Error:', err);
    setError(err.message);
  }
};

// Component pattern: check error state
const { data, error, loading } = useData();
if (error) return <div>Error: {error}</div>;
if (loading) return <Loader />;
return <div>{data}</div>;

// RLS/Permission errors: Supabase returns error with count=0 on delete
if (count === 0) throw new Error('No tenés permisos...');
```

**Special Cases:**
- Delete transaction permission denied: hook catches `count === 0` from delete response, shows error toast
- Group join already member: RPC returns error, caught in `joinGroup()`, error shown to user
- AI API key missing: `getGeminiClient()` throws, caught in ImportExpenses page

## Cross-Cutting Concerns

**Logging:**
- Console.error for data hook failures with `[Hook Name]` prefix
- Example: `console.error('[useTransactions] Delete error:', err)`

**Validation:**
- Email/password validation in Login component
- Category name trimming in `addCategory()`
- Filters applied in `usePersonalTransactions` with date/category bounds checking

**Authentication:**
- Supabase Auth handles session tokens
- Custom RLS policies in database enforce data isolation
- RPC functions use "Security Definer" to elevate permissions for specific operations
- Hooks check `if (!user)` before mutations

**Caching/Refresh:**
- useEffect refetches data when dependencies change (groupId, user)
- Manual refresh via `refreshTransactions()`, `refreshGroups()`, `refreshRates()` functions
- No external cache layer; state held in React component/context

---

*Architecture analysis: 2026-01-23*
