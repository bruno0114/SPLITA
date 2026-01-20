# Codebase Structure

**Analysis Date:** 2026-01-20

## Directory Layout

```
SPLITA-1/
├── src/                    # Application source code
│   ├── components/         # Shared/global components
│   │   ├── layout/         # App shell components (Sidebar, Header, BottomNav)
│   │   └── ui/             # Reusable UI primitives (currently empty)
│   ├── context/            # Global React contexts (Toast)
│   ├── features/           # Feature modules (core business logic)
│   │   ├── analytics/      # Category analytics feature
│   │   │   ├── hooks/      # useCategoryStats
│   │   │   └── pages/      # Categories, CategoryDetail
│   │   ├── auth/           # Authentication feature
│   │   │   ├── components/ # Auth-specific components
│   │   │   ├── context/    # AuthContext provider
│   │   │   ├── hooks/      # useAuth
│   │   │   └── pages/      # Login, Onboarding
│   │   ├── dashboard/      # Personal finance dashboard
│   │   │   ├── components/ # Dashboard-specific components
│   │   │   ├── hooks/      # usePersonalTransactions, useEconomicHealth
│   │   │   └── pages/      # PersonalFinance, EconomicHealth
│   │   ├── expenses/       # Group expense management
│   │   │   ├── components/ # Expense-specific components
│   │   │   ├── hooks/      # useTransactions
│   │   │   └── pages/      # ImportExpenses
│   │   ├── groups/         # Group management feature
│   │   │   ├── components/ # InviteModal, etc.
│   │   │   ├── hooks/      # useGroups
│   │   │   └── pages/      # Groups, GroupDetails, JoinGroup
│   │   └── settings/       # User settings feature
│   │       ├── components/ # AISettings
│   │       ├── hooks/      # useProfile
│   │       └── pages/      # Settings
│   ├── hooks/              # Shared custom hooks (useToast)
│   ├── lib/                # Utilities and configurations
│   ├── services/           # External service integrations (AI)
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Main app component with routing
│   └── index.tsx           # Application entry point
├── dist/                   # Production build output
├── .planning/              # GSD planning documents
│   └── codebase/           # Codebase analysis (this document)
├── .gsd/                   # GSD project state and phases
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundler configuration
└── supabase_*.sql          # Database schema/migration scripts
```

## Directory Purposes

**`src/features/`:**
- Purpose: Contains all feature-specific code organized by domain
- Contains: Subdirectories per feature, each with pages/, hooks/, components/
- Key files: Feature pages are the primary exports

**`src/features/{feature}/pages/`:**
- Purpose: Top-level route components for each feature
- Contains: React components that are rendered by the router
- Key files: `PersonalFinance.tsx`, `Groups.tsx`, `Settings.tsx`, `Categories.tsx`

**`src/features/{feature}/hooks/`:**
- Purpose: Custom hooks encapsulating data fetching and state
- Contains: `use*.ts` files with Supabase integration
- Key files: `useGroups.ts`, `useTransactions.ts`, `usePersonalTransactions.ts`, `useAuth.ts`

**`src/features/{feature}/components/`:**
- Purpose: Feature-specific UI components (not pages)
- Contains: Modals, cards, forms specific to the feature
- Key files: `InviteModal.tsx`, `AISettings.tsx`

**`src/components/layout/`:**
- Purpose: Application shell and navigation components
- Contains: Sidebar, Header, BottomNav, ProtectedRoute
- Key files: `Sidebar.tsx`, `Header.tsx`, `BottomNav.tsx`, `ProtectedRoute.tsx`

**`src/components/ui/`:**
- Purpose: Reusable UI primitives (buttons, inputs, etc.)
- Contains: Currently empty - components are inline
- Key files: None yet

**`src/context/`:**
- Purpose: Global React context providers (non-feature-specific)
- Contains: ToastContext for app-wide notifications
- Key files: `ToastContext.tsx`

**`src/lib/`:**
- Purpose: Shared utilities, client configurations, constants
- Contains: Supabase client, image utilities, category config
- Key files: `supabase.ts`, `constants.ts`, `image-utils.ts`

**`src/services/`:**
- Purpose: External API integrations
- Contains: AI service for Gemini integration
- Key files: `ai.ts`

**`src/types/`:**
- Purpose: TypeScript type definitions
- Contains: Domain interfaces and enums
- Key files: `index.ts`

**`src/hooks/`:**
- Purpose: Shared custom hooks (used across features)
- Contains: Re-exports or utility hooks
- Key files: `useToast.ts`

## Key File Locations

**Entry Points:**
- `src/index.tsx`: React app mount point, provider wrapping
- `src/App.tsx`: Route definitions, layout rendering

**Configuration:**
- `vite.config.ts`: Build config, path aliases (`@/` = `src/`)
- `tsconfig.json`: TypeScript compiler options
- `package.json`: Dependencies, npm scripts

**Core Logic:**
- `src/features/groups/hooks/useGroups.ts`: Group CRUD operations
- `src/features/expenses/hooks/useTransactions.ts`: Group transaction management
- `src/features/dashboard/hooks/usePersonalTransactions.ts`: Personal finance CRUD
- `src/features/auth/context/AuthContext.tsx`: Auth state management
- `src/services/ai.ts`: Gemini AI integration for expense extraction

**Testing:**
- No test files detected in current codebase

**Styling:**
- Tailwind CSS classes inline in components
- No separate CSS files detected (Tailwind utility-first)

## Naming Conventions

**Files:**
- Pages: `PascalCase.tsx` (e.g., `PersonalFinance.tsx`, `Groups.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useGroups.ts`, `useAuth.ts`)
- Components: `PascalCase.tsx` (e.g., `Sidebar.tsx`, `InviteModal.tsx`)
- Utilities: `kebab-case.ts` (e.g., `image-utils.ts`)
- Types: `index.ts` in types directory

**Directories:**
- Features: `lowercase` (e.g., `auth`, `groups`, `expenses`)
- Subdirectories: `lowercase` (e.g., `pages`, `hooks`, `components`)

**Components:**
- React components: PascalCase function names matching filename
- Props interfaces: `{ComponentName}Props` (e.g., `SidebarProps`, `HeaderProps`)

**Hooks:**
- Hook functions: `use{Resource}` (e.g., `useGroups`, `useAuth`)
- Return objects: `{ data, loading, error, ...actions }`

**Types:**
- Interfaces: PascalCase (e.g., `User`, `Transaction`, `Group`)
- Enums: PascalCase with all-caps values (e.g., `AppRoute.DASHBOARD_PERSONAL`)

## Where to Add New Code

**New Feature:**
- Primary code: `src/features/{feature-name}/`
- Create subdirectories: `pages/`, `hooks/`, `components/`
- Add route in: `src/App.tsx`
- Tests: Not established (see CONCERNS.md)

**New Page in Existing Feature:**
- Implementation: `src/features/{feature}/pages/{PageName}.tsx`
- Add route in: `src/App.tsx`

**New Hook:**
- Feature-specific: `src/features/{feature}/hooks/use{Name}.ts`
- Shared/utility: `src/hooks/use{Name}.ts`

**New Component:**
- Feature-specific: `src/features/{feature}/components/{ComponentName}.tsx`
- Shared layout: `src/components/layout/{ComponentName}.tsx`
- Shared UI primitive: `src/components/ui/{ComponentName}.tsx`

**New Context:**
- Feature-specific: `src/features/{feature}/context/{Name}Context.tsx`
- Global: `src/context/{Name}Context.tsx`

**New Type:**
- Add to: `src/types/index.ts`

**New Utility:**
- Add to: `src/lib/{utility-name}.ts`

**New Service:**
- Add to: `src/services/{service-name}.ts`

**Database Changes:**
- Create SQL file: `supabase_{description}.sql` in project root
- Document schema in file comments

## Special Directories

**`.planning/`:**
- Purpose: GSD planning and codebase analysis documents
- Generated: By GSD mapping commands
- Committed: Yes

**`.gsd/`:**
- Purpose: GSD project state, phases, templates
- Generated: By GSD commands
- Committed: Yes

**`dist/`:**
- Purpose: Production build output
- Generated: By `npm run build`
- Committed: No (in .gitignore)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: By `npm install`
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-01-20*
