# Codebase Concerns

**Analysis Date:** 2025-01-20

## Tech Debt

**Pervasive `any` Type Usage:**
- Issue: Over 50 instances of `any` type assertions throughout the codebase, bypassing TypeScript's type safety
- Files:
  - `src/services/ai.ts` (lines 114, 172, 216, 243)
  - `src/features/groups/pages/GroupDetails.tsx` (lines 88, 103, 361, 414, 451, 617-619, 627)
  - `src/features/groups/hooks/useGroups.ts` (lines 57, 67, 76, 125, 151, 172, 193, 219)
  - `src/features/expenses/hooks/useTransactions.ts` (lines 44, 55, 68, 127, 185, 210)
  - `src/features/analytics/pages/Categories.tsx` (line 25)
  - `src/features/analytics/pages/CategoryDetail.tsx` (lines 112, 116)
  - `src/features/auth/pages/Onboarding.tsx` (lines 161, 206, 237, 350, 378, 467)
  - `src/features/auth/hooks/useAuth.ts` (lines 20, 27, 35)
- Impact: Runtime errors go undetected at compile time; refactoring becomes error-prone
- Fix approach: Define proper interfaces for Supabase responses and API data; use generics for hooks

**Dual Transaction Type Systems:**
- Issue: Two incompatible transaction interfaces exist - `Transaction` (groups) and `PersonalTransaction` (personal)
- Files:
  - `src/types/index.ts` (Transaction interface)
  - `src/features/dashboard/hooks/usePersonalTransactions.ts` (PersonalTransaction interface)
- Impact: Analytics page (`src/features/analytics/pages/Categories.tsx`) requires `as any[]` cast; inconsistent field names (`merchant` vs `title`)
- Fix approach: Unify into single polymorphic Transaction type with discriminated union or shared base interface

**Large Monolithic Components:**
- Issue: Several page components exceed 400+ lines with embedded sub-components
- Files:
  - `src/features/groups/pages/GroupDetails.tsx` (727 lines, contains 3 components)
  - `src/features/auth/pages/Onboarding.tsx` (570 lines, contains 7 step components)
  - `src/features/expenses/pages/ImportExpenses.tsx` (417 lines)
  - `src/features/dashboard/pages/PersonalFinance.tsx` (353 lines)
- Impact: Difficult to test in isolation; poor code navigation; higher cognitive load
- Fix approach: Extract modal components (GroupSettingsModal, GroupTransactionModal) to separate files; extract onboarding steps to individual components

**Console Logging in Production Code:**
- Issue: 35+ console.log/error/warn statements throughout production code
- Files:
  - `src/services/ai.ts` (lines 43, 67, 69, 80, 107, 115, 173, 244)
  - `src/features/groups/hooks/useGroups.ts` (lines 77, 100, 104, 116, 120, 126)
  - `src/features/dashboard/hooks/usePersonalTransactions.ts` (lines 73, 106, 110, 115, 133, 137, 141, 157, 161, 165)
  - `src/features/auth/pages/Onboarding.tsx` (lines 426, 443, 455, 461)
- Impact: Cluttered browser console; potential information leakage; no structured logging
- Fix approach: Implement proper logging service with log levels; strip console statements in production builds

## Known Bugs

**Search Input Non-Functional:**
- Symptoms: Search input in GroupDetails.tsx has no onChange handler or filtering logic
- Files: `src/features/groups/pages/GroupDetails.tsx` (lines 238-239)
- Trigger: Type in "Buscar gastos..." input field
- Workaround: None - feature appears implemented but is not wired up

**Category Progress Bar Color Hack:**
- Symptoms: Progress bar color extraction uses fragile string manipulation
- Files: `src/features/analytics/pages/Categories.tsx` (lines 125-132)
- Trigger: Categories with certain color classes may render incorrectly
- Workaround: Currently uses inline style fallback

## Security Considerations

**API Keys in Client-Side Code:**
- Risk: Gemini API keys stored in user profile and passed to client-side AI service
- Files:
  - `src/services/ai.ts` (line 22 - falls back to env var)
  - `src/features/settings/hooks/useProfile.ts` (stores gemini_api_key)
  - `src/features/settings/components/AISettings.tsx` (displays/edits key)
- Current mitigation: Keys stored in Supabase profiles table (RLS protected); env var fallback
- Recommendations: Consider server-side proxy for AI calls to hide API keys entirely; validate key server-side before storing

**Supabase Anon Key in Frontend:**
- Risk: Public anon key exposed in client bundle (expected for Supabase but requires proper RLS)
- Files: `src/lib/supabase.ts` (lines 4-5)
- Current mitigation: Supabase RLS policies (assumed to be in place)
- Recommendations: Audit RLS policies for all tables; ensure no sensitive data accessible without auth

**Invite Code Security:**
- Risk: Invite codes generated client-side with weak randomness
- Files: `src/features/groups/hooks/useGroups.ts` (line 226)
- Current mitigation: Codes are 8-char alphanumeric uppercase
- Recommendations: Generate invite codes server-side (Supabase function); add expiration; limit uses

## Performance Bottlenecks

**Unnecessary Re-fetching:**
- Problem: Full data refetch after every mutation (add/update/delete)
- Files:
  - `src/features/groups/hooks/useGroups.ts` (fetchGroups called after every mutation)
  - `src/features/expenses/hooks/useTransactions.ts` (fetchTransactions called after every mutation)
  - `src/features/dashboard/hooks/usePersonalTransactions.ts` (same pattern)
- Cause: No optimistic updates or cache management
- Improvement path: Implement optimistic updates with rollback; use React Query or SWR for caching

**Balance Calculation in Render:**
- Problem: Complex balance calculations run on every render via useMemo
- Files: `src/features/groups/pages/GroupDetails.tsx` (lines 35-75)
- Cause: useMemo dependencies include entire transactions array
- Improvement path: Calculate balances server-side or cache results; debounce recalculation

## Fragile Areas

**Transaction Split Logic:**
- Files:
  - `src/features/expenses/hooks/useTransactions.ts` (lines 103-116, 169-181)
  - `src/features/groups/pages/GroupDetails.tsx` (lines 46-64)
- Why fragile: Split deletion and re-insertion on update is not atomic; balance calculation assumes equal splits
- Safe modification: Always test with multi-member groups; verify balance calculations match after edits
- Test coverage: None - no test files exist in project

**Onboarding Data Flow:**
- Files: `src/features/auth/pages/Onboarding.tsx` (lines 385-466)
- Why fragile: Complex multi-step form with async Supabase operations; errors in later steps don't rollback earlier ones
- Safe modification: Test complete flow end-to-end; handle partial failures gracefully
- Test coverage: None

**Analytics Type Coercion:**
- Files:
  - `src/features/analytics/pages/Categories.tsx` (line 25)
  - `src/features/analytics/pages/CategoryDetail.tsx` (lines 112, 116)
- Why fragile: Uses `as any[]` to bridge incompatible transaction types
- Safe modification: First unify transaction types, then update analytics
- Test coverage: None

## Scaling Limits

**In-Memory Model Cache:**
- Current capacity: Unbounded Map storing model names per API key
- Limit: Memory growth with many unique API keys
- Files: `src/services/ai.ts` (line 15)
- Scaling path: Add TTL; limit cache size; consider localStorage for persistence

**No Pagination:**
- Current capacity: All transactions loaded at once
- Limit: Performance degrades with 100+ transactions per group
- Files:
  - `src/features/expenses/hooks/useTransactions.ts` (no limit in query)
  - `src/features/dashboard/hooks/usePersonalTransactions.ts` (no limit in query)
- Scaling path: Implement cursor-based pagination; add virtual scrolling for lists

## Dependencies at Risk

**React 19 (Bleeding Edge):**
- Risk: React 19.2.3 is extremely new; ecosystem compatibility concerns
- Files: `package.json` (line 14)
- Impact: Some third-party libraries may not be compatible
- Migration plan: Consider pinning to React 18.x for stability if issues arise

**Minimal Type Coverage:**
- Risk: Only `@types/react-router-dom` installed; no other type packages
- Files: `package.json` (devDependencies)
- Impact: Missing types for some dependencies
- Migration plan: Add `@types/react` if issues arise with React 19

## Missing Critical Features

**No Test Infrastructure:**
- Problem: Zero test files exist in the project
- Files: `package.json` (no test script or test dependencies)
- Blocks: Confident refactoring; regression prevention; CI/CD pipelines

**No Error Boundaries:**
- Problem: Uncaught errors will crash entire app
- Files: `src/App.tsx` (no ErrorBoundary wrapper)
- Blocks: Graceful error handling; production stability

**No Offline Support:**
- Problem: App requires constant network connectivity
- Blocks: Mobile use cases; poor connectivity scenarios

**Missing Password Reset Flow:**
- Problem: Login page has no "forgot password" functionality
- Files: `src/features/auth/pages/Login.tsx` (no reset link/flow)
- Blocks: Users who forget passwords

## Test Coverage Gaps

**Entire Application Untested:**
- What's not tested: All features - authentication, groups, transactions, analytics, settings
- Files: No test files exist (searched for `*.test.*` and `*.spec.*`)
- Risk: Any refactoring or bug fix could introduce regressions unnoticed
- Priority: High - critical for maintainability

**Specific High-Risk Untested Areas:**
1. Balance calculations (`src/features/groups/pages/GroupDetails.tsx` lines 35-75)
2. Transaction split logic (`src/features/expenses/hooks/useTransactions.ts`)
3. AI extraction parsing (`src/services/ai.ts`)
4. Onboarding multi-step form (`src/features/auth/pages/Onboarding.tsx`)
5. Group invite/join flow (`src/features/groups/hooks/useGroups.ts`, `src/features/groups/pages/JoinGroup.tsx`)

---

*Concerns audit: 2025-01-20*
