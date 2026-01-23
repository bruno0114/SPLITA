# Codebase Concerns

**Analysis Date:** 2026-01-23

## Tech Debt

**Component Size & Complexity:**
- Issue: Several large, monolithic components exceed 1000+ lines with multiple responsibilities
- Files: `src/features/groups/pages/GroupDetails.tsx` (1131 lines), `src/features/expenses/pages/ImportExpenses.tsx` (896 lines), `src/features/auth/pages/Onboarding.tsx` (629 lines)
- Impact: Difficult to test, maintain, and refactor. High risk of introducing bugs when making changes
- Fix approach: Break into smaller, focused sub-components with clear separation of concerns. Extract modal content, form sections, and data management into separate files

**Widespread Use of `any` Type:**
- Issue: TypeScript `any` type used extensively throughout codebase, bypassing type safety
- Files: `src/context/GroupsContext.tsx`, `src/features/expenses/components/TransactionModal.tsx`, `src/features/auth/pages/Onboarding.tsx`, `src/features/auth/hooks/useAuth.ts`
- Impact: Loss of compile-time type checking, increased runtime errors, reduced IDE autocomplete benefits
- Fix approach: Replace `any` with specific types. Create discriminated unions for response types (`{data?: T, error: string}`). Use generics for reusable patterns

**Untyped Component Props & Parameters:**
- Issue: Multiple function parameters use `any` instead of explicit types
- Files: `src/features/auth/hooks/useAuth.ts` - `signInWithPassword`, `signUp`, `signInWithOAuth` all use `any`
- Impact: No type safety at call sites, easier to pass wrong data
- Fix approach: Define explicit interfaces for auth payloads

**Missing Error Boundaries:**
- Issue: No React Error Boundary components present
- Impact: Single component error will crash entire application with no graceful fallback
- Fix approach: Add Error Boundary wrapper in `src/App.tsx` and around feature sections

## Security Considerations

**API Keys Exposed in Vite Config:**
- Risk: Vite config defines `process.env.GEMINI_API_KEY` which may be leaked in bundle
- Files: `vite.config.ts` (line 14-15)
- Current mitigation: Using VITE_ prefix only, but still embedded in JavaScript
- Recommendations: Remove from vite.config define. Let VITE_GEMINI_API_KEY be accessed via import.meta.env only at runtime when authenticated

**Gemini API Key Storage:**
- Risk: User API keys stored in Supabase `profiles.gemini_api_key` - single point of failure
- Files: `src/features/settings/hooks/useProfile.ts`
- Current mitigation: Supposed to be encrypted in database, but unverified
- Recommendations: Verify Supabase column has encryption. Add row-level security policy to prevent keys from being readable by other users

**RLS Permission Error Handling:**
- Risk: Incomplete RLS policy enforcement - code catches "PERMISSION_DENIED" but doesn't consistently validate ownership
- Files: `src/features/expenses/hooks/useTransactions.ts` (line 246, 272), `src/features/dashboard/hooks/usePersonalTransactions.ts` (line 353, 362, 388, 405)
- Current mitigation: Frontend checks count === 0 to detect permission failures, but database-level RLS is first line of defense
- Recommendations: Verify Supabase RLS policies prevent non-payers from deleting transactions. Add audit logging for deletion attempts

**localStorage Lacks Validation:**
- Risk: Data stored in localStorage is not validated before use
- Files: `src/App.tsx` (lines 70, 133-146), multiple locations parsing JSON from localStorage
- Current mitigation: Try-catch blocks around JSON.parse in some places, but not all
- Recommendations: Validate schema of localStorage data before using. Use zod or similar for runtime type checking

## Known Bugs

**TODO Comment in BottomNav:**
- Symptoms: Navigation state unclear for action buttons
- Files: `src/components/layout/BottomNav.tsx` (line 62)
- Trigger: When bottom nav action handler is invoked
- Workaround: None documented

**DEBUG Panel Left in Production Code:**
- Symptoms: "DEBUG PANEL (SOLO DEV)" visible in ImportExpenses page
- Files: `src/features/expenses/pages/ImportExpenses.tsx` (line 842)
- Trigger: Always rendered in UI
- Impact: Confusing for users, may indicate incomplete development cleanup
- Workaround: Conditional rendering based on environment

## Performance Bottlenecks

**Multiple Database Queries in usePersonalTransactions:**
- Problem: Fetches three separate queries (personal paged, personal full, group splits) sequentially
- Files: `src/features/dashboard/hooks/usePersonalTransactions.ts` (lines 87-139)
- Cause: Separated to avoid "blocking," but causes waterfall pattern
- Improvement path: Use Promise.all() to fetch in parallel. Implement pagination at database level with cursor

**Inefficient Balance Calculations:**
- Problem: Balance calculation in GroupDetails uses O(n*m) algorithm for every transaction
- Files: `src/features/groups/pages/GroupDetails.tsx` (lines 49-94)
- Cause: Iterates transactions and splitWith array on every render
- Improvement path: Memoize calculation better. Consider moving to backend RPC or caching

**Modal Rendering via Portal Without Cleanup:**
- Problem: Portal component creates modals at document.body level but doesn't escape parent stacking context
- Files: `src/components/ui/Portal.tsx` (line 10)
- Cause: All modals rendered at same depth, z-index wars possible
- Improvement path: Use explicit z-index layering system or create modal stack manager

## Fragile Areas

**Onboarding Data Sync Logic:**
- Files: `src/App.tsx` (lines 48-127)
- Why fragile: Complex state machine with localStorage, navigation redirects, and conditional async operations. Multiple race conditions possible if component re-renders during async operations
- Safe modification: Extract to custom hook with proper loading state. Add state guard to prevent duplicate requests
- Test coverage: No tests for onboarding sync, particularly for multi-tab scenarios

**Import/Gemini Processing State Machine:**
- Files: `src/features/expenses/pages/ImportExpenses.tsx` (lines 103-200)
- Why fragile: Complex step-by-step processing with manual state transitions. If network request fails mid-processing, state may be inconsistent
- Safe modification: Add explicit transaction boundaries. Ensure all state updates are atomic
- Test coverage: Debug info suggests manual testing, no automated tests

**Group Member Management:**
- Files: `src/features/groups/pages/GroupDetails.tsx` (lines 1-100)
- Why fragile: Balance calculations assume all members are present. If member is deleted from group, balance calculation may break
- Safe modification: Add validation that all splitWith members exist in group.members before calculating
- Test coverage: No tests for edge cases (deleted members, missing profiles)

**Custom Split Amount Logic:**
- Files: `src/features/groups/pages/GroupDetails.tsx` (lines 835-845)
- Why fragile: Manual custom split tracking with Record<string, string>. No validation that amounts sum correctly
- Safe modification: Validate that custom amounts sum to transaction.amount before save
- Test coverage: Missing validation tests

## Scaling Limits

**In-Memory Model Cache:**
- Current capacity: Single map per API key
- Limit: Only one model selection cached per key, no cache invalidation strategy
- Files: `src/services/ai.ts` (lines 15-16, 54-57)
- Scaling path: Replace with time-based cache expiry. Monitor cache hit rates

**Group Member Fetching:**
- Current capacity: All members fetched for each group list operation
- Files: `src/context/GroupsContext.tsx` (lines 54-66)
- Scaling path: Add pagination or lazy-load member profiles only when needed. Implement virtual scrolling for large groups

**AI History Session Storage:**
- Current capacity: Session ID based on Date.now()
- Files: `src/features/expenses/pages/ImportExpenses.tsx` (line 110)
- Risk: No uniqueness guarantee if multiple users upload simultaneously in same millisecond
- Fix: Use UUIDv4 for session IDs

## Dependencies at Risk

**Unmaintained Recharts:**
- Risk: recharts has minimal updates, no TypeScript support in some areas
- Impact: Cannot upgrade to latest React versions without workarounds. Performance issues on large datasets
- Migration plan: Consider switching to lightweight alternatives (visx, nivo) or custom SVG charting

**Google GenAI SDK (@google/genai):**
- Risk: Early-stage SDK, API may change without notice
- Impact: Breaking changes could require code refactoring
- Mitigation: Currently using v1.37.0, monitor for version updates. Consider wrapping in abstraction layer

**No Testing Framework:**
- Risk: Zero test coverage increases debt accumulation velocity
- Impact: Regressions compound, each new feature increases risk
- Critical: Add vitest + React Testing Library before major refactoring

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: All utility functions, hooks, services
- Files: `src/services/ai.ts`, `src/services/dolar-api.ts`, `src/lib/expert-math.ts`
- Risk: Expense extraction logic, debt simplification algorithm, rate conversion untested
- Priority: High - core financial logic without tests

**No Integration Tests:**
- What's not tested: Transaction creation flow, split calculation, group joining
- Files: `src/features/expenses/hooks/useTransactions.ts`, `src/context/GroupsContext.tsx`
- Risk: Database state inconsistencies, RLS bypasses not detected
- Priority: High - affects data integrity

**No E2E Tests:**
- What's not tested: Full user flows (login → create group → add expense → settle up)
- Risk: Critical workflows may break without detection
- Priority: Medium - can use manual testing during development, but should add E2E before production

**Missing Edge Case Coverage:**
- Files: All large components
- Gaps:
  - Empty state handling
  - Network timeout scenarios
  - Concurrent operation safety (double-click, rapid requests)
  - Mobile viewport responsiveness
  - Offline mode behavior

## Missing Critical Features

**No Offline Support:**
- Problem: App requires constant network connectivity
- Blocks: Users cannot work offline or with poor connections
- Impact: Mobile users with spotty connectivity cannot use app

**No Request Debouncing/Throttling:**
- Problem: Rapid user actions can trigger duplicate database requests
- Files: All modal save handlers
- Blocks: Prevents double-submission safeguards
- Impact: Potential duplicate transactions if user double-clicks save button

**No Automatic Retry Logic:**
- Problem: Network failures immediately surface to user with no retry
- Files: All Supabase queries
- Blocks: Unreliable network experience
- Impact: User frustration, data loss risk

**Missing Loading State Feedback:**
- Problem: Some async operations don't show loading indicators
- Files: Delete operations, balance calculations
- Impact: User uncertainty about operation status
- Priority: Medium

**No Rate Limiting Protection:**
- Problem: No client-side rate limiting on API calls
- Files: `src/services/dolar-api.ts`, `src/services/ai.ts`
- Impact: Risk of quota exhaustion from accidental rapid requests

## TypeScript Strictness

**Implicit Any in catch Clauses:**
- Issue: `catch (err: any)` used everywhere instead of `catch (err: unknown)`
- Files: `src/context/GroupsContext.tsx`, `src/features/expenses/hooks/useTransactions.ts`, etc.
- Impact: No type narrowing, unsafe error handling
- Fix: Enable `useUnknownInCatchVariables` in tsconfig, replace with proper type guards

**Missing null/undefined Checks:**
- Issue: Some code assumes data exists without validation
- Example: `t.payer.full_name` could be null but used directly
- Files: `src/features/expenses/hooks/useTransactions.ts` (line 52)
- Impact: Runtime errors possible when data is incomplete
- Fix: Use optional chaining, provide fallback values

## Environmental & Configuration Issues

**No Environment Variable Validation:**
- Risk: Missing VITE_SUPABASE_URL throws at module load time
- Files: `src/lib/supabase.ts` (lines 7-9)
- Impact: No clear feedback about which env vars are missing
- Fix: List all required env vars and provide clear error messages

**Hardcoded Magic Numbers:**
- Issue: PAGE_SIZE (20), timeouts, retry counts scattered throughout
- Files: `src/features/dashboard/hooks/usePersonalTransactions.ts` (line 38)
- Impact: Hard to configure for different deployments
- Fix: Move to environment config

**No Build Output Analysis:**
- Risk: Unknown final bundle size, no tree-shaking verification
- Impact: Could be shipping unused code
- Fix: Add bundle analyzer to build process

---

*Concerns audit: 2026-01-23*
