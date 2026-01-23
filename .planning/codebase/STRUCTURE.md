# Codebase Structure

**Analysis Date:** 2026-01-23

## Directory Layout

```
src/
├── components/               # Shared UI components and layouts
│   ├── layout/              # Navigation and page structure
│   │   ├── AppLayout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── BottomNav.tsx
│   ├── ui/                  # Reusable UI elements
│   │   ├── Portal.tsx
│   │   ├── AnimatedPrice.tsx
│   │   ├── PremiumConfirmModal.tsx
│   │   ├── PremiumDropdown.tsx
│   │   ├── PremiumToggleGroup.tsx
│   │   ├── PremiumDatePicker.tsx
│   │   └── PremiumButton.tsx (example)
│   └── ai/                  # AI-related UI components
│
├── context/                 # Global context providers
│   ├── AuthContext.tsx
│   ├── ToastContext.tsx
│   ├── GroupsContext.tsx
│   └── CurrencyContext.tsx
│
├── features/                # Feature modules (domain-driven)
│   ├── auth/                # Authentication
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   └── Onboarding.tsx
│   │   └── components/
│   │
│   ├── expenses/            # Transaction management
│   │   ├── hooks/
│   │   │   ├── useTransactions.ts (group transactions)
│   │   │   ├── usePersonalTransactions.ts
│   │   │   └── useAIHistory.ts
│   │   ├── pages/
│   │   │   ├── ImportExpenses.tsx (AI import)
│   │   │   └── AIHistory.tsx
│   │   ├── components/
│   │   │   ├── TransactionModal.tsx
│   │   │   ├── TransactionCard.tsx
│   │   │   ├── BulkActionsBar.tsx
│   │   │   ├── HistoryDetailModal.tsx
│   │   └── services/
│   │       └── personality.ts (AI service helpers)
│   │
│   ├── groups/              # Group management
│   │   ├── hooks/
│   │   │   └── useGroups.ts
│   │   ├── pages/
│   │   │   ├── Groups.tsx (list)
│   │   │   ├── GroupDetails.tsx (detail view)
│   │   │   └── JoinGroup.tsx (invite join)
│   │   └── components/
│   │       └── InviteModal.tsx
│   │
│   ├── dashboard/           # Personal finance dashboard
│   │   ├── hooks/
│   │   │   ├── usePersonalTransactions.ts
│   │   │   ├── useEconomicHealth.ts
│   │   │   └── useProjections.ts
│   │   ├── pages/
│   │   │   ├── PersonalFinance.tsx
│   │   │   └── EconomicHealth.tsx
│   │   └── components/
│   │       ├── ExpenditureEvolutionChart.tsx
│   │       ├── ProjectionCard.tsx
│   │       ├── ProjectionsModal.tsx
│   │       └── SubscriptionModal.tsx
│   │
│   ├── analytics/           # Category analytics
│   │   ├── hooks/
│   │   │   ├── useCategories.ts
│   │   │   └── useCategoryStats.ts
│   │   ├── pages/
│   │   │   ├── Categories.tsx
│   │   │   └── CategoryDetail.tsx
│   │   └── components/
│   │       └── CategoryManagerModal.tsx
│   │
│   └── settings/            # User settings
│       ├── hooks/
│       │   └── useProfile.ts
│       ├── pages/
│       │   └── Settings.tsx
│       └── components/
│           └── AISettings.tsx
│
├── hooks/                   # Shared custom hooks (not feature-specific)
│
├── lib/                     # Utilities and library wrappers
│   ├── supabase.ts          # Supabase client initialization
│   ├── ai-prompts.ts        # AI prompt templates
│   ├── constants.ts         # App constants (routes, limits)
│   ├── expert-math.ts       # Math/calculation utilities
│   ├── image-utils.ts       # Image processing helpers
│   └── [other utilities]
│
├── services/                # External service integrations
│   ├── ai.ts                # Google Gemini service wrapper
│   └── dolar-api.ts         # Currency exchange rate API
│
├── types/                   # TypeScript type definitions
│   └── index.ts             # Central type exports
│
├── App.tsx                  # Main App router component
└── index.tsx                # React DOM mount point, provider stack
```

## Directory Purposes

**`src/components/layout/`**
- Purpose: Layout structure, navigation, page chrome
- Contains: Sidebar, Header, BottomNav, ProtectedRoute wrapper
- Key files:
  - `Sidebar.tsx` - Desktop left nav with collapsible state
  - `Header.tsx` - Top bar with title, theme switcher, mobile menu
  - `BottomNav.tsx` - Mobile bottom navigation
  - `ProtectedRoute.tsx` - Route guard that redirects to login if unauthorized

**`src/components/ui/`**
- Purpose: Reusable atomic and composite UI components
- Contains: Buttons, modals, form inputs, animated elements
- Key files:
  - `Portal.tsx` - React Portal for modal rendering
  - `PremiumConfirmModal.tsx` - Generic confirmation dialog
  - `AnimatedPrice.tsx` - Currency-aware animated number display
  - `PremiumDatePicker.tsx` - Date range picker component

**`src/context/`**
- Purpose: Global application state providers
- Key files:
  - `AuthContext.tsx` - User session and auth state
  - `GroupsContext.tsx` - Groups list, create/update/delete, join group
  - `CurrencyContext.tsx` - Exchange rates, currency preference
  - `ToastContext.tsx` - Toast notification queue and display

**`src/features/*/hooks/`**
- Purpose: Data fetching and business logic for each feature
- Pattern: Each hook returns `{ data, loading, error, actions }`
- Examples:
  - `useTransactions(groupId)` - Group transaction list with add/update/delete
  - `usePersonalTransactions()` - User's personal income/expenses
  - `useCategories()` - Category CRUD with real-time subscription
  - `useEconomicHealth()` - Financial health metrics calculation

**`src/features/*/pages/`**
- Purpose: Full-page components that orchestrate features
- Pattern: Consume hooks, manage page-level state (modals, filters, selections)
- Contains business logic for routing, filtering, pagination

**`src/features/*/components/`**
- Purpose: Feature-specific sub-components
- Pattern: Dumb/presentational components that receive props from pages
- Examples: TransactionCard, TransactionModal, CategoryManagerModal

**`src/lib/`**
- Purpose: Low-level utilities, constants, wrappers
- Key files:
  - `supabase.ts` - Supabase client singleton
  - `constants.ts` - AppRoute enum, feature flags, limits
  - `expert-math.ts` - Financial calculations (projections, stats)
  - `ai-prompts.ts` - Prompt templates for AI

**`src/services/`**
- Purpose: External API integration wrappers
- Key files:
  - `ai.ts` - Google Gemini client with model selection, error handling
  - `dolar-api.ts` - Fetch USD/ARS exchange rates

**`src/types/`**
- Purpose: TypeScript interface and enum definitions
- Key file: `index.ts` - Centralized exports for User, Transaction, Group, etc.

## Key File Locations

**Entry Points:**
- `src/index.tsx` - React DOM render with provider stack
- `src/App.tsx` - Main router, layout structure, theme logic

**Configuration:**
- `tsconfig.json` - TypeScript config with path aliases (`@/` → `./src/`)
- `src/lib/constants.ts` - App constants and routes
- `src/types/index.ts` - Type definitions

**Core Logic:**
- `src/features/auth/context/AuthContext.tsx` - Auth state, session hydration
- `src/context/GroupsContext.tsx` - Group management state
- `src/features/expenses/hooks/useTransactions.ts` - Group transaction CRUD
- `src/features/dashboard/hooks/usePersonalTransactions.ts` - Personal finance logic

**Testing:**
- Test files not detected in structure (no test files found)

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `TransactionCard.tsx`, `PersonalFinance.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useTransactions.ts`, `useAuth.ts`)
- Utils/Services: camelCase (e.g., `supabase.ts`, `ai-prompts.ts`)
- Types: Lower case with `.ts` extension (e.g., `index.ts`)

**Directories:**
- Feature folders: camelCase (e.g., `expenses`, `dashboard`, `analytics`)
- Semantic grouping: `pages/`, `hooks/`, `components/`, `context/`, `services/`

**Exports:**
- Named exports for reusable hooks and utilities
- Default export for page components and providers
- Type exports grouped in `src/types/index.ts`

## Where to Add New Code

**New Feature (e.g., Budgets):**
- Create folder: `src/features/budgets/`
- Add pages: `src/features/budgets/pages/Budgets.tsx`
- Add hook: `src/features/budgets/hooks/useBudgets.ts`
- Add components: `src/features/budgets/components/BudgetCard.tsx`
- Export types in: `src/types/index.ts` (add Budget interface)
- Register route in: `src/App.tsx` (add AppRoute enum and Route)
- Update navigation: `src/components/layout/Sidebar.tsx` (add NavItem)

**New Reusable UI Component:**
- Location: `src/components/ui/ComponentName.tsx`
- Pattern: Accept props, no hooks (unless stateful, then use hooks)
- Export from: `src/components/ui/index.ts` (create if needed)
- Usage: Import in feature components

**New Global State (e.g., Notifications):**
- Create context: `src/context/NotificationContext.tsx`
- Export provider and hook: `export const NotificationProvider`, `export const useNotifications`
- Wrap app: Add to provider stack in `src/index.tsx`
- Consume: `const { notify } = useNotifications()`

**New Data Hook (within feature):**
- Location: `src/features/[feature]/hooks/useNewHook.ts`
- Pattern:
  ```typescript
  export const useNewHook = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
      // Supabase query
    }, [user?.id]);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    return { data, loading, error, refresh: fetchData };
  };
  ```

**New Utility Function:**
- Location: `src/lib/utility-name.ts` (or add to existing `expert-math.ts`)
- Pattern: Pure function, no side effects
- Export: Named export
- Usage: Import in hooks or components

**New Service Integration:**
- Location: `src/services/service-name.ts`
- Pattern: Wrapper around external API/SDK
- Export: Functions and error types
- Usage: Called from hooks or context

## Special Directories

**`src/components/ai/`**
- Purpose: AI-specific UI components (future expansion)
- Generated: No (manual code)
- Committed: Yes

**`node_modules/`**
- Purpose: npm dependencies
- Generated: Yes (npm install)
- Committed: No

**`.env` / Environment Variables**
- Purpose: Supabase credentials, API keys
- Location: Root directory (`.env.local` or `.env`)
- Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`
- Committed: No (add to `.gitignore`)

**`dist/`**
- Purpose: Production build output
- Generated: Yes (vite build)
- Committed: No

---

*Structure analysis: 2026-01-23*
