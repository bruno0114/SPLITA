# Codebase Structure

**Analysis Date:** 2026-01-21

## Directory Layout

```
/Users/brunoaguilar/SPLITA-1/
├── src/
│   ├── index.tsx              # React root entry point with all providers
│   ├── App.tsx                # Main app router and layout
│   ├── types/
│   │   └── index.ts           # All TypeScript interfaces (User, Transaction, Group, Category, AppRoute enum)
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client initialization
│   │   ├── ai-prompts.ts      # Gemini prompts for expense extraction
│   │   ├── constants.ts       # App constants
│   │   ├── expert-math.ts     # Mathematical utilities
│   │   └── image-utils.ts     # Image processing helpers
│   ├── services/
│   │   ├── ai.ts              # Google Gemini API integration (expense extraction, model selection)
│   │   └── dolar-api.ts       # External currency rate API integration
│   ├── context/
│   │   ├── AuthContext.tsx    # Global auth state + login/logout
│   │   ├── ToastContext.tsx   # Global toast notification system
│   │   ├── GroupsContext.tsx  # Global groups state (user's groups list)
│   │   └── CurrencyContext.tsx # Global currency selection (ARS/USD)
│   ├── hooks/
│   │   └── useToast.ts        # Export of useToast hook
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx    # Left sidebar navigation (desktop)
│   │   │   ├── BottomNav.tsx  # Bottom navigation (mobile)
│   │   │   ├── Header.tsx     # Top header with title and theme toggle
│   │   │   └── ProtectedRoute.tsx # Route guard component
│   │   ├── ui/
│   │   │   ├── AnimatedPrice.tsx
│   │   │   ├── PremiumDropdown.tsx
│   │   │   ├── PremiumToggleGroup.tsx
│   │   │   ├── PremiumDatePicker.tsx
│   │   │   ├── PremiumConfirmModal.tsx
│   │   │   └── [other UI components]
│   │   └── ai/
│   │       └── StardustOverlay.tsx
│   └── features/
│       ├── auth/
│       │   ├── pages/
│       │   │   ├── Login.tsx
│       │   │   └── Onboarding.tsx
│       │   ├── components/
│       │   ├── context/
│       │   │   └── AuthContext.tsx (feature-local auth context)
│       │   └── hooks/
│       │       └── useAuth.ts
│       ├── dashboard/
│       │   ├── pages/
│       │   │   ├── PersonalFinance.tsx
│       │   │   └── EconomicHealth.tsx
│       │   ├── components/
│       │   │   ├── ProjectionCard.tsx
│       │   │   ├── SubscriptionModal.tsx
│       │   │   ├── ExpenditureEvolutionChart.tsx
│       │   │   └── ProjectionsModal.tsx
│       │   └── hooks/
│       │       ├── usePersonalTransactions.ts
│       │       └── useEconomicHealth.ts
│       ├── expenses/
│       │   ├── pages/
│       │   │   ├── ImportExpenses.tsx
│       │   │   └── AIHistory.tsx
│       │   ├── components/
│       │   │   ├── TransactionModal.tsx
│       │   │   ├── HistoryDetailModal.tsx
│       │   │   ├── BulkActionsBar.tsx
│       │   │   └── TransactionCard.tsx
│       │   ├── hooks/
│       │   │   ├── useTransactions.ts
│       │   │   └── useAIHistory.ts
│       │   └── services/
│       │       └── personality.ts
│       ├── groups/
│       │   ├── pages/
│       │   │   ├── Groups.tsx
│       │   │   ├── GroupDetails.tsx
│       │   │   └── JoinGroup.tsx
│       │   ├── components/
│       │   │   └── InviteModal.tsx
│       │   └── hooks/
│       │       └── useGroups.ts
│       ├── analytics/
│       │   ├── pages/
│       │   │   ├── Categories.tsx
│       │   │   └── CategoryDetail.tsx
│       │   ├── components/
│       │   │   └── CategoryManagerModal.tsx
│       │   └── hooks/
│       │       ├── useCategories.ts
│       │       └── useCategoryStats.ts
│       └── settings/
│           ├── pages/
│           │   └── Settings.tsx
│           ├── components/
│           │   └── AISettings.tsx
│           └── hooks/
│               └── useProfile.ts
├── vite.config.ts             # Vite build config with path alias '@' → './src'
├── package.json               # Dependencies (React, Supabase, Recharts, Framer Motion, etc.)
└── index.html                 # HTML entry point (not shown but standard Vite structure)
```

## Directory Purposes

**src/types/**
- Purpose: Centralized TypeScript type definitions
- Contains: Interfaces for User, Transaction, PersonalTransaction, Category, Group, Insight; AppRoute enum; Currency type; Theme type
- Key files: `src/types/index.ts` (all types in one file for easy access)

**src/lib/**
- Purpose: Shared utilities, constants, configuration, and library initialization
- Contains: Supabase client setup, AI prompt templates, mathematical helpers, image utilities, constants
- Key files: `src/lib/supabase.ts` (Supabase client), `src/lib/ai-prompts.ts` (Gemini prompts)

**src/services/**
- Purpose: Integration with external APIs and specialized business logic
- Contains: Google Gemini AI service (expense extraction), currency rate API client
- Key files: `src/services/ai.ts` (AI expense extraction logic with model caching and smoke tests)

**src/context/**
- Purpose: Global state management via React Context
- Contains: Auth state, groups state, currency selection, toast notifications
- Key files: `src/context/AuthContext.tsx`, `src/context/GroupsContext.tsx` (Supabase-based data fetching)

**src/components/**
- Purpose: Shared UI components and layout wrappers
- Organized by: `layout/` (page structure), `ui/` (reusable UI elements), `ai/` (AI-specific components)
- Key files: `src/components/layout/ProtectedRoute.tsx` (auth guard)

**src/features/**
- Purpose: Domain-specific feature modules with self-contained responsibility
- Structure: Each feature has `pages/`, `components/`, `hooks/`, optionally `services/` and `context/`
- Pattern: Import what you need from other features; avoid circular dependencies
- Key features:
  - `auth/`: Authentication (login, sign-up, OAuth, session management)
  - `dashboard/`: Personal finance dashboard and economic health views
  - `expenses/`: Transaction management, AI import, history
  - `groups/`: Group creation, viewing, joining, member management
  - `analytics/`: Category views and stats
  - `settings/`: User profile and settings

## Key File Locations

**Entry Points:**
- `src/index.tsx`: React root render with all context providers
- `src/App.tsx`: Route definitions, layout structure, theme management
- `vite.config.ts`: Build configuration with '@' alias and port settings

**Configuration:**
- `vite.config.ts`: Vite build settings, environment variable loading, path alias
- `src/lib/supabase.ts`: Supabase client with URL and anon key from env vars
- `src/lib/constants.ts`: App-wide constants (category icons, payment methods, etc.)

**Core Logic:**
- `src/features/auth/hooks/useAuth.ts`: Auth actions (sign-in, sign-up, sign-out)
- `src/features/dashboard/hooks/usePersonalTransactions.ts`: Personal transaction CRUD and filtering
- `src/features/expenses/hooks/useTransactions.ts`: Group transaction CRUD
- `src/features/groups/hooks/useGroups.ts`: Group CRUD and management
- `src/features/analytics/hooks/useCategories.ts`: Category CRUD

**Testing:**
- No test files detected; testing patterns not established

**Shared Utilities:**
- `src/lib/ai-prompts.ts`: Prompts for Gemini expense extraction
- `src/lib/expert-math.ts`: Currency conversion and mathematical operations
- `src/lib/image-utils.ts`: Image handling for receipt processing

## Naming Conventions

**Files:**
- Page components: PascalCase in `pages/` directory (e.g., `PersonalFinance.tsx`, `ImportExpenses.tsx`)
- Feature components: PascalCase in `components/` (e.g., `TransactionCard.tsx`, `InviteModal.tsx`)
- Custom hooks: camelCase starting with `use` (e.g., `usePersonalTransactions.ts`, `useAuth.ts`)
- Services: camelCase, descriptive name (e.g., `dolar-api.ts`, `personality.ts`)
- Utilities/libraries: camelCase or hyphenated (e.g., `ai-prompts.ts`, `expert-math.ts`)

**Directories:**
- Feature directories: lowercase, plural nouns (e.g., `features/expenses`, `features/groups`)
- Internal feature structure: lowercase, singular (e.g., `pages`, `components`, `hooks`, `services`)
- UI component directories: lowercase (e.g., `ui`, `layout`)

**Variables & Functions:**
- React components: PascalCase (e.g., `PersonalFinance`, `TransactionCard`)
- Hooks: camelCase starting with `use` (e.g., `usePersonalTransactions`)
- State variables: camelCase (e.g., `selectedGroupId`, `filters`, `loadingMore`)
- Constants: UPPER_SNAKE_CASE (e.g., `PAGE_SIZE = 20` in hooks)

**Types & Interfaces:**
- Interfaces: PascalCase, descriptive (e.g., `PersonalFinanceSummary`, `TransactionFilters`)
- Enums: PascalCase (e.g., `AppRoute`)
- Type unions: camelCase or descriptive (e.g., `ImportStep`, `ToastType`)

## Where to Add New Code

**New Feature Module:**
1. Create `src/features/{featureName}/` directory
2. Add subdirectories: `pages/`, `components/`, `hooks/`
3. Create feature pages in `pages/{PageName}.tsx`
4. Create feature-specific components in `components/{ComponentName}.tsx`
5. Create data-fetching hooks in `hooks/use{Feature}.ts`
6. Import and route in `src/App.tsx` if user-facing
7. Follow existing hook pattern: return `{ data, loading, error, ...operations }`

**New Page/Route:**
1. Create feature directory or add to existing feature
2. Create page component in `src/features/{feature}/pages/{PageName}.tsx`
3. Add route definition in `src/App.tsx` within `<Routes>` block
4. Add `AppRoute` enum value in `src/types/index.ts` if new top-level route
5. Add navigation in `src/components/layout/Sidebar.tsx` and/or `BottomNav.tsx`
6. Use `@/features/{feature}/pages/{PageName}` import path

**New Hook (Data Fetching):**
1. Create in `src/features/{feature}/hooks/use{Feature}.ts` (or `src/hooks/` if shared)
2. Use Supabase client: `import { supabase } from '@/lib/supabase'`
3. Follow pattern:
   - Use `useState` for `loading`, `error`, data state
   - Use `useCallback` for data operations
   - Return object with: `{ data, loading, error, ...operations }`
   - Use `useAuth()` to get current user for RLS filtering
4. Consume in components: `const { data, loading } = useFeature()`

**New Shared Component:**
1. Create in `src/components/ui/{ComponentName}.tsx` if generic UI
2. Create in `src/components/layout/{ComponentName}.tsx` if layout-related
3. For feature-specific components, keep in `src/features/{feature}/components/`
4. Pass props for configuration; avoid hardcoding values
5. Use Tailwind classes for styling; match existing color palette

**New Utility/Service:**
1. External API integration: Add to `src/services/{serviceName}.ts` or extend existing
2. Helper functions: Add to `src/lib/{utilityName}.ts`
3. Constants: Add to `src/lib/constants.ts`
4. Make exports explicit; name functions clearly
5. Add JSDoc comments for public functions

**New Context/Global State:**
1. Create in `src/context/{FeatureName}Context.tsx`
2. Follow pattern: create context, Provider component, custom hook
3. Wrap relevant portion of provider tree in `src/index.tsx`
4. Provide both state and operations (fetch, create, update, delete)
5. Handle loading/error states

**Database Integration:**
1. All data fetched via Supabase client (`src/lib/supabase.ts`)
2. RLS policies enforce per-user filtering automatically
3. Use named selects for nested relationships (see `src/features/expenses/hooks/useTransactions.ts` lines 20-37 for pattern)
4. Handle pagination via `range()` for performance on large tables
5. Subscribe to real-time updates via `.on('*')` if needed (not yet implemented)

## Special Directories

**dist/:**
- Purpose: Build output directory
- Generated: Yes (via `npm run build`)
- Committed: No (.gitignore)

**node_modules/:**
- Purpose: Installed dependencies
- Generated: Yes (via `npm install`)
- Committed: No (.gitignore)

**src/features/{feature}/services/:**
- Purpose: Feature-specific API/business logic (rare; most in hooks)
- Example: `src/features/expenses/services/personality.ts` (unknown purpose)
- Pattern: Extend if feature needs complex data transformation outside hooks

**src/components/ai/:**
- Purpose: AI-specific UI components
- Example: `StardustOverlay.tsx` (visual effect for AI processing)
- Pattern: Keep AI-related visuals separate from core UI

## Routing Patterns

**Route Enum Location:** `src/types/index.ts` (lines 78-89)

**Route Usage Pattern:**
```typescript
// Define routes with enum
enum AppRoute {
  DASHBOARD_PERSONAL = '/',
  IMPORT = '/importar',
  GROUP_DETAILS = '/grupos/:groupId',
}

// Use in navigation
navigate(AppRoute.DASHBOARD_PERSONAL)

// Use in route definition
<Route path={AppRoute.DASHBOARD_PERSONAL} element={<PersonalFinance />} />
```

**Protected vs Public Routes:**
- Protected routes: Wrapped in `<Route element={<ProtectedRoute />}>` in `src/App.tsx` (line 198)
- Public routes: Auth pages (`LOGIN`, `ONBOARDING`) render separately when `isAuthRoute === true` (line 153)
- Special case: `/unirse/:inviteCode` (join group) is protected but outside main layout

**Navigation:**
- Desktop: Via `Sidebar` component (click nav items)
- Mobile: Via `BottomNav` component (bottom tab bar)
- Programmatic: `useNavigate()` hook from React Router
- All navigation uses `AppRoute` enum values, never hardcoded paths
