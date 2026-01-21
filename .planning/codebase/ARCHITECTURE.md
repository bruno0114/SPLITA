# Architecture

**Analysis Date:** 2026-01-21

## Pattern Overview

**Overall:** Modular Feature-Driven SPA with Layered Context State Management

**Key Characteristics:**
- Feature-based module organization (`/features/auth`, `/features/dashboard`, `/features/expenses`, etc.)
- React Context API for global state (Auth, Groups, Currency, Toast)
- Supabase as single source of truth for all data persistence
- Custom hook layer for data fetching and business logic (`usePersonalTransactions`, `useTransactions`, `useCategories`, etc.)
- React Router v6 for routing with protected routes and enum-based route definitions
- TypeScript for full type safety with centralized type definitions in `src/types/index.ts`

## Layers

**Presentation Layer (Components & Pages):**
- Purpose: User interface rendering and interaction
- Location: `src/components/` and `src/features/*/pages/`
- Contains: React components, page views, UI components
- Depends on: Custom hooks, Context providers, UI libraries (lucide-react, recharts, framer-motion)
- Used by: React Router for route rendering

**Feature Modules:**
- Purpose: Encapsulate domain-specific functionality with full responsibility chains
- Location: `src/features/{featureName}/` containing `pages/`, `components/`, `hooks/`, `services/`
- Contains: Feature pages, feature-specific components, feature hooks, optional services
- Depends on: Shared hooks, shared context, types, services
- Used by: App.tsx routing, other features via imports

**Custom Hooks Layer:**
- Purpose: Data fetching, state management, business logic encapsulation
- Location: `src/features/*/hooks/` and `src/hooks/`
- Contains: Hooks like `usePersonalTransactions`, `useTransactions`, `useAuth`, `useGroups`, `useCategories`
- Depends on: Supabase client, Auth context
- Used by: Page components for data and operations

**Context Layer (Global State):**
- Purpose: Shared state across application (auth, groups, currency, notifications)
- Location: `src/context/` and `src/features/auth/context/`
- Contains: `AuthContext`, `GroupsContext`, `CurrencyContext`, `ToastContext`
- Depends on: Supabase client
- Used by: Components and hooks throughout the app

**Service Layer:**
- Purpose: External API integration and specialized business logic
- Location: `src/services/`
- Contains: `ai.ts` (Google Gemini integration), `dolar-api.ts` (currency rates)
- Depends on: External APIs, Supabase
- Used by: Custom hooks and components

**Utilities & Configuration:**
- Purpose: Constants, prompts, helper functions, library initialization
- Location: `src/lib/` and helper files
- Contains: `supabase.ts` (Supabase client), `ai-prompts.ts`, `constants.ts`, `expert-math.ts`, `image-utils.ts`
- Depends on: External libraries
- Used by: Services, hooks, components

## Data Flow

**User Authentication Flow:**
1. User visits `/ingresar` or `/bienvenida`
2. `Login`/`Onboarding` components render without auth requirement
3. `useAuth()` hook calls Supabase OAuth/password sign-in
4. `AuthContext` listens to `supabase.auth.onAuthStateChange()` and updates global state
5. `ProtectedRoute` component redirects to login if no session
6. App stores onboarding preferences in `localStorage` for post-OAuth sync
7. `App.tsx` useEffect syncs pending onboarding data to Supabase (`user_settings`, `groups`, `group_members`)

**Transaction Management Flow (Personal):**
1. User navigates to `PersonalFinance` page (`/`)
2. `usePersonalTransactions` hook fetches transactions from `personal_transactions` table with RLS filtering
3. Hook applies client-side filters (`TransactionFilters`) for date, category, type
4. Component renders paginated list with infinite scroll via IntersectionObserver
5. User action (add/edit/delete) calls hook functions which update Supabase
6. Hook re-fetches data and updates local state via `setTransactions`
7. Toast notifications (`useToast`) show operation results

**Transaction Management Flow (Groups):**
1. User navigates to `Groups` page (`/grupos`)
2. `GroupsContext` provides list of user's groups from `group_members` ↔ `groups` join
3. User selects group or views `GroupDetails` (`/grupos/:groupId`)
4. `useTransactions(groupId)` fetches group transactions with nested `profiles` and `transaction_splits`
5. Component displays split breakdown and balances
6. Operations (add/edit/delete) persist to `transactions` and `transaction_splits` tables

**AI Import Flow (Expense Detection):**
1. User navigates to `ImportExpenses` (`/importar`)
2. Component collects images via file input
3. `extractExpensesFromImages()` from `services/ai.ts` calls Google Gemini API
4. AI extracts structured transaction data (merchant, amount, category)
5. User reviews and confirms detected transactions
6. Confirmed transactions are saved to `personal_transactions` or group `transactions`
7. `uploadReceipt()` from `useAIHistory` records the import session in `ai_import_sessions`

**State Management:**
- **Authentication:** Supabase auth state + `AuthContext` (singleton pattern)
- **Global data:** `GroupsContext` (user's groups), `CurrencyContext` (ARS/USD), `ToastContext` (notifications)
- **Feature state:** Local React component state + custom hooks for data
- **Persistence:** All data persists to Supabase; client caches data in component state until refresh
- **Optimistic updates:** Hook functions update local state before server confirmation (no retry logic visible)

## Key Abstractions

**AppRoute Enum:**
- Purpose: Type-safe route definitions to eliminate magic strings
- Location: `src/types/index.ts` lines 78-89
- Examples: `AppRoute.DASHBOARD_PERSONAL = '/'`, `AppRoute.IMPORT = '/importar'`
- Pattern: Enum-based routes passed to `useNavigate()` and `Link` components

**Custom Data Hooks:**
- Purpose: Encapsulate data fetching and CRUD operations
- Examples: `usePersonalTransactions`, `useTransactions`, `useCategories`, `useGroups`
- Pattern: Return loading/error states, data arrays, and operation functions (addTransaction, updateTransaction, deleteTransaction)
- Location: `src/features/{feature}/hooks/`

**Context Providers:**
- Purpose: Centralize and share state across component tree
- Examples: `AuthProvider`, `GroupsProvider`, `CurrencyProvider`, `ToastProvider`
- Pattern: Context + useContext custom hooks (e.g., `useAuthContext()`, `useToast()`)
- Location: `src/context/` and `src/features/auth/context/`

**Supabase RLS (Row-Level Security):**
- Purpose: Enforce server-side data access control per user
- Pattern: All tables have RLS policies; `supabase.auth.user()` filters queries by `user_id`
- Benefit: No client-side auth logic needed; database enforces data isolation

**Feature Module Boundary:**
- Purpose: Organize by domain (auth, dashboard, expenses, groups, analytics, settings)
- Pattern: Each feature self-contained with pages, components, hooks; minimal cross-feature imports
- Location: `src/features/{featureName}/`

## Entry Points

**Application Root:**
- Location: `src/index.tsx`
- Triggers: Browser load
- Responsibilities: Render React root, wrap app with all providers (Auth, Toast, Groups, Currency, Router)

**App Component:**
- Location: `src/App.tsx`
- Triggers: After all providers initialize
- Responsibilities: Define all routes, manage layout (Sidebar, Header, BottomNav), handle theme, handle auth state changes (post-OAuth onboarding sync)

**Protected Route Guard:**
- Location: `src/components/layout/ProtectedRoute.tsx`
- Triggers: Route navigation attempt
- Responsibilities: Check `useAuth()` loading/user state; redirect to login/onboarding if not authenticated; render Outlet if authenticated

**Layout Components:**
- `src/components/layout/Sidebar.tsx`: Left navigation (md+ screens)
- `src/components/layout/BottomNav.tsx`: Bottom navigation (mobile)
- `src/components/layout/Header.tsx`: Top header with route title and theme toggle

## Error Handling

**Strategy:** Try-catch blocks at data fetch points; error state in hooks; toast notifications for user feedback

**Patterns:**
- Data hooks set `error` state and log to console on Supabase errors
- Components display error messages inline or via toast
- AI service (Google Gemini) returns custom error codes (`AIErrorCode`): `'API_KEY_MISSING'`, `'INVALID_KEY'`, `'NO_SUITABLE_MODEL'`, `'REJECTED_BY_AI'`, `'RATE_LIMIT'`, `'UNKNOWN_ERROR'`
- Graceful degradation: If AI extraction fails, user returns to upload step; if transaction save fails, user retains form data
- No global error boundary detected; errors handled locally in components/hooks

## Cross-Cutting Concerns

**Logging:** Console.log used throughout (see `src/features/dashboard/hooks/usePersonalTransactions.ts` line 75); no centralized logging framework

**Validation:** Form validation via component state; type safety via TypeScript; Supabase RLS enforces data integrity server-side

**Authentication:** Supabase Auth (OAuth + email/password); session managed via `AuthContext`; all API calls implicitly authenticated by Supabase client

**Authorization:** Row-Level Security (RLS) policies in Supabase enforce per-user data access; no client-side role checks visible (all users are participants/admins of their own groups)

**State Persistence:** React Context (volatile) + localStorage for theme preference; all persistent data in Supabase

**Theme Management:** Three-level theme support (light/dark/system) stored in localStorage; applied to document root via class name injection (`App.tsx` lines 116-127)
