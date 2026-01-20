# Architecture

**Analysis Date:** 2026-01-20

## Pattern Overview

**Overall:** Feature-Based Modular Architecture (React SPA)

**Key Characteristics:**
- Single Page Application with client-side routing via React Router
- Feature-based directory organization (auth, expenses, groups, dashboard, analytics, settings)
- Each feature contains its own pages, hooks, and components in isolation
- Centralized state via React Context (Auth, Toast) at the app root
- Supabase as Backend-as-a-Service (BaaS) for auth, database, and storage
- No explicit state management library (uses React hooks and context)

## Layers

**Presentation Layer:**
- Purpose: Renders UI, handles user interactions
- Location: `src/features/*/pages/`, `src/features/*/components/`, `src/components/`
- Contains: React functional components (TSX), UI layouts, modals
- Depends on: Hooks layer, types
- Used by: App router

**Hooks Layer (Data Access):**
- Purpose: Encapsulates data fetching, state, and CRUD operations
- Location: `src/features/*/hooks/`, `src/hooks/`
- Contains: Custom React hooks (`use*.ts`) that interact with Supabase
- Depends on: Supabase client (`src/lib/supabase.ts`), AuthContext
- Used by: Page components

**Context Layer (Global State):**
- Purpose: Manages global application state (auth, toasts)
- Location: `src/features/auth/context/AuthContext.tsx`, `src/context/ToastContext.tsx`
- Contains: React Context providers with state and actions
- Depends on: Supabase client
- Used by: All components via hooks

**Services Layer:**
- Purpose: External API integrations (AI services)
- Location: `src/services/`
- Contains: AI service for Gemini API (`src/services/ai.ts`)
- Depends on: Environment variables, Supabase client
- Used by: Feature pages (ImportExpenses, EconomicHealth)

**Library Layer:**
- Purpose: Shared utilities, constants, and configurations
- Location: `src/lib/`
- Contains: Supabase client init, image utilities, constants
- Depends on: Environment variables
- Used by: All layers

**Types Layer:**
- Purpose: TypeScript type definitions
- Location: `src/types/index.ts`
- Contains: Domain interfaces (User, Transaction, Group, etc.)
- Depends on: Nothing
- Used by: All layers

## Data Flow

**Authentication Flow:**

1. User opens app, `index.tsx` wraps App in `AuthProvider`
2. `AuthProvider` calls `supabase.auth.getSession()` on mount
3. Auth state changes update `user` and `session` in context
4. `ProtectedRoute` component checks `useAuth()` and redirects unauthenticated users to `/login`
5. Login/Onboarding pages call `supabase.auth` methods directly via `useAuth()` hook

**Data Fetching Flow (Example: Groups):**

1. `Groups.tsx` page calls `useGroups()` hook
2. `useGroups()` hook fetches data from Supabase via `supabase.from('groups').select()`
3. Data is transformed from DB schema to UI types within the hook
4. Hook returns `{ groups, loading, error, createGroup, ... }`
5. Component renders based on returned state

**CRUD Operations:**

1. User triggers action (e.g., create group button)
2. Component calls hook method (e.g., `createGroup(name, type)`)
3. Hook performs Supabase mutation, handles errors
4. Hook triggers `fetchGroups()` to refresh data
5. Toast notification displayed via `showToast()` from ToastContext

**State Management:**
- Local component state for UI concerns (modals, form inputs)
- Hook-level state for feature data (transactions, groups)
- Context for app-wide state (auth, toasts)
- No Redux/Zustand - relies on React's built-in patterns

## Key Abstractions

**Feature Module:**
- Purpose: Self-contained feature with pages, hooks, and components
- Examples: `src/features/auth/`, `src/features/groups/`, `src/features/expenses/`
- Pattern: Each feature exports its pages which compose hooks and components

**Data Hook:**
- Purpose: Encapsulates all data operations for a domain entity
- Examples: `src/features/groups/hooks/useGroups.ts`, `src/features/expenses/hooks/useTransactions.ts`
- Pattern: Returns `{ data, loading, error, ...actions }` tuple

**Context Provider:**
- Purpose: Global state accessible via hook
- Examples: `src/features/auth/context/AuthContext.tsx`, `src/context/ToastContext.tsx`
- Pattern: `<Provider value={{...}}>` wrapping `children`, consumed via `useContext()`

**Layout Component:**
- Purpose: Consistent app shell and navigation
- Examples: `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/BottomNav.tsx`
- Pattern: Receives current route and navigation callback props

## Entry Points

**Application Entry:**
- Location: `src/index.tsx`
- Triggers: Browser loading `index.html`
- Responsibilities: Mounts React app, wraps with providers (Auth, Toast, BrowserRouter)

**Routing Entry:**
- Location: `src/App.tsx`
- Triggers: After providers mount
- Responsibilities: Defines all routes, renders layout shell, handles navigation

**Protected Routes:**
- Location: `src/components/layout/ProtectedRoute.tsx`
- Triggers: When accessing protected paths
- Responsibilities: Checks auth state, redirects or renders `<Outlet />`

**Supabase Client:**
- Location: `src/lib/supabase.ts`
- Triggers: Imported by any module needing DB/auth access
- Responsibilities: Creates and exports configured Supabase client

## Error Handling

**Strategy:** Try-catch in hooks with error state propagation

**Patterns:**
- Hooks catch errors in async operations and set `error` state
- Components check `error` state and may display error UI
- Toast notifications for user-facing error messages via `showToast(message, 'error')`
- Console logging for debugging (`console.error()`)

**Example from `useGroups.ts`:**
```typescript
try {
    // ... Supabase operations
} catch (err: any) {
    console.error('[useGroups] Error:', err);
    showToast(err.message || 'Error al crear el grupo', 'error');
    return { data: null, error: err.message };
}
```

## Cross-Cutting Concerns

**Logging:** Console-based (`console.log`, `console.error`) with prefixes like `[useGroups]`

**Validation:** Client-side form validation in components; Supabase RLS for server-side

**Authentication:** Supabase Auth with Google OAuth and email/password; session managed via `AuthContext`

**Theming:** CSS variables with Tailwind dark mode class; theme state in `App.tsx`

**Internationalization:** Hardcoded Spanish (Argentina) strings throughout; no i18n library

**Currency:** Client-side formatting with `Intl.NumberFormat('es-AR', ...)`; ARS/USD toggle in header

---

*Architecture analysis: 2026-01-20*
