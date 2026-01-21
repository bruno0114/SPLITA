# Codebase Concerns

**Analysis Date:** 2026-01-21

## Tech Debt

**Component Size and Complexity:**
- Issue: Single components contain excessive logic and state management, exceeding 800+ lines
- Files: `src/features/groups/pages/GroupDetails.tsx` (1098 lines), `src/features/expenses/pages/ImportExpenses.tsx` (896 lines), `src/features/auth/pages/Onboarding.tsx` (581 lines)
- Impact: Difficult to test, maintain, and reason about. High cognitive load. Increased likelihood of bugs during refactoring.
- Fix approach: Extract sub-components and custom hooks. Break down ImportExpenses into separate steps with dedicated components. Move state management to custom hooks.

**Type Safety Issues:**
- Issue: Loose typing with `any` types used in critical places
- Files: `src/features/groups/pages/GroupDetails.tsx:39` (editingTransaction: any), `src/features/groups/pages/GroupDetails.tsx:504` (GroupSettingsModalProps group: any), `src/features/expenses/pages/AIHistory.tsx:13` (selectedSession: any), `src/features/dashboard/hooks/usePersonalTransactions.ts:275` (updateData: any), `src/features/settings/hooks/useProfile.ts:48` (updates: any)
- Impact: Loss of type checking benefits. Potential runtime errors. Increased maintenance burden when modifying data structures.
- Fix approach: Define explicit interfaces for all component props and hook parameters. Replace `any` with proper types from `src/types/index.ts`.

**Unprotected localStorage Usage:**
- Issue: JSON.parse without try-catch when reading from localStorage
- Files: `src/App.tsx:46` (localStorage.getItem('pending_onboarding') -> JSON.parse without validation)
- Impact: Corrupted or manually-edited localStorage can crash the app with uncaught exceptions.
- Fix approach: Wrap all JSON.parse in try-catch blocks. Validate data shape after parsing. Add fallback defaults.

**Console Logs Left in Production Code:**
- Issue: Excessive console.log, console.warn, console.error statements throughout the codebase
- Files: Over 40 locations including `src/features/expenses/pages/ImportExpenses.tsx`, `src/services/ai.ts`, `src/context/GroupsContext.tsx`
- Impact: Noise in production logs. Potential information disclosure. Makes debugging harder to filter real issues.
- Fix approach: Remove all non-essential console statements. Use structured logging with environment checks (only in dev/staging).

**Debug Panel Left in Production:**
- Issue: Dev-only debug panel visible in ImportExpenses component with raw error data
- Files: `src/features/expenses/pages/ImportExpenses.tsx:839-892` (DEBUG PANEL marked "SOLO DEV")
- Impact: Exposes internal error details and system information to end users. Security risk.
- Fix approach: Conditionally render debug panel only in development environment (`import.meta.env.DEV`). Remove before production.

## Known Bugs

**Hardcoded Exchange Rate Default:**
- Symptoms: When importing expenses with USD currency, default exchange rate of 1000 is used if not explicitly fetched
- Files: `src/features/expenses/pages/ImportExpenses.tsx:234`
- Trigger: User imports USD transactions and clicks "Confirmar importación" without clicking "Sincronizar T.C. Blue"
- Workaround: Click "Sincronizar T.C. Blue" button to fetch current rates before importing

**Navigation Route Inconsistency:**
- Symptoms: Some parts of the code use hardcoded route strings while others use AppRoute enum
- Files: `src/features/expenses/pages/ImportExpenses.tsx:466` (hardcoded `/grupos/${selectedGroupId}` instead of AppRoute constant)
- Trigger: Refactor may have missed this location
- Workaround: Manual inspection shows routes work but not standardized

**Missing Fallback for Group Member Images:**
- Symptoms: Group member avatars may display broken images if avatar_url is null
- Files: `src/features/groups/pages/GroupDetails.tsx` handles null but some UI components don't guard against it
- Impact: UI shows broken image icons for users without avatars

## Security Considerations

**API Key Exposure in Browser Environment:**
- Risk: User Gemini API keys stored in browser localStorage and transmitted with requests
- Files: `src/features/settings/hooks/useProfile.ts`, `src/services/ai.ts:23` (using userKey directly)
- Current mitigation: Keys are optional, system can fall back to env var. User is shown warnings about API keys.
- Recommendations:
  - Implement server-side proxy for AI requests instead of client-side API key usage
  - Add encryption for stored API keys in localStorage
  - Implement request signing to prevent key theft
  - Add rate limiting to prevent key abuse

**Supabase Credentials in Environment:**
- Risk: VITE_SUPABASE_ANON_KEY is public but exposed in build. Anon key has limited permissions via RLS.
- Files: `src/lib/supabase.ts:1-2` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- Current mitigation: RLS policies should enforce user isolation. Anon key has limited scope.
- Recommendations:
  - Verify RLS policies are correctly enforced (recent commits suggest RLS implementation)
  - Monitor for unauthorized data access patterns
  - Document expected RLS behavior for each table

**Insufficient Error Boundary:**
- Risk: Unhandled promise rejections and uncaught errors can crash the app without user feedback
- Files: Multiple async operations lack centralized error handling
- Impact: Users see blank screens instead of error messages
- Recommendations: Implement React Error Boundary component, add global error handler for unhandled promises

**Unvalidated Data from AI Service:**
- Risk: Data extracted by Gemini API is not validated before inserting into database
- Files: `src/features/expenses/pages/ImportExpenses.tsx:376-415` (scannedTransactions directly used)
- Impact: Malformed or malicious data could corrupt database or cause calculation errors
- Recommendations: Add schema validation for AI output using Zod or similar library before inserting

## Performance Bottlenecks

**N+1 Query Issue in Groups Fetch:**
- Problem: Fetches all group members and their profiles for each group, could scale poorly with large groups
- Files: `src/context/GroupsContext.tsx:54-67` (nested profile selection in group_members)
- Cause: Fetches full member data on every groups refresh. No pagination or limiting.
- Improvement path: Implement lazy loading for member lists. Fetch member count initially, load details on demand. Consider caching strategy.

**Unoptimized Re-renders in ImportExpenses:**
- Problem: Large transaction list re-renders on every txSettings change
- Files: `src/features/expenses/pages/ImportExpenses.tsx:228-243` (scannedTransactions effect causes re-render)
- Cause: No memoization of transaction card components or handler functions
- Improvement path: Memoize transaction cards with React.memo. Use useCallback for all handlers. Consider virtualization for long lists.

**Repeated API Calls on Component Mount:**
- Problem: fetchTransactions called without dependency cleanup, could trigger multiple times
- Files: `src/features/dashboard/hooks/usePersonalTransactions.ts:60-150` (fetchTransactions callback)
- Cause: useCallback dependencies may not fully isolate side effects
- Improvement path: Add explicit dependency tracking. Use useEffect cleanup to cancel in-flight requests.

**No Pagination on Historical Data:**
- Problem: Loads all transactions into memory. PersonalFinance pagination uses 20-item pages but loads all for calculations
- Files: `src/features/dashboard/hooks/usePersonalTransactions.ts:36` (PAGE_SIZE = 20)
- Impact: Memory bloat for users with thousands of transactions
- Improvement path: Implement cursor-based pagination. Calculate totals on server-side aggregations.

**Image Compression Blocking Main Thread:**
- Problem: WebP compression done synchronously in file handler
- Files: `src/features/groups/pages/GroupDetails.tsx:588` (compressToWebP called during file upload)
- Impact: UI freezes during large image uploads
- Improvement path: Move image compression to Web Worker. Show progress indicator.

## Fragile Areas

**ImportExpenses Component State Management:**
- Files: `src/features/expenses/pages/ImportExpenses.tsx`
- Why fragile: Multiple interdependent state objects (step, files, scannedTransactions, txSettings, selectedGroupId). Complex effect dependencies. Manual state synchronization between views.
- Safe modification: Add comprehensive unit tests before refactoring. Extract state to custom hook (useImportState). Use state machine pattern for step transitions.
- Test coverage: No unit tests exist for this component. Critical business logic (expense import) is untested.

**Group Balance Calculations:**
- Files: `src/features/groups/pages/GroupDetails.tsx:47-150` (balances useMemo)
- Why fragile: Complex debt simplification logic using external library. Missing edge case handling for null/undefined values.
- Safe modification: Add unit tests for balance calculation. Add guards against null splits. Test with various split scenarios.
- Test coverage: No tests for balance calculation logic.

**Transaction Split Logic:**
- Files: `src/features/expenses/hooks/useTransactions.ts:115-140` (split insertion), `src/features/dashboard/hooks/usePersonalTransactions.ts:251-310` (split updates)
- Why fragile: Multiple code paths for handling splits (customSplits vs splitBetween vs single user). String-based IDs for split identification ('split-' prefix).
- Safe modification: Consolidate split logic into single location. Use enum or type for ID prefixes. Add comprehensive tests.
- Test coverage: No unit tests for split logic.

**AI Service Model Selection:**
- Files: `src/services/ai.ts:53-88` (getEffectiveModel)
- Why fragile: Fallback list of models is hardcoded. Smoke test may fail intermittently due to rate limits. Cache not cleared on errors.
- Safe modification: Make model list configurable. Add exponential backoff for smoke tests. Implement cache invalidation strategy.
- Test coverage: No tests for model selection logic.

## Scaling Limits

**In-Memory Model Cache:**
- Current capacity: Single API key cached per session
- Limit: No cleanup of cache. Model stays cached until page reload. Multiple API key switching not handled efficiently.
- Scaling path: Implement LRU cache for multiple keys. Add cache TTL. Clear old entries.

**Transaction Processing Throughput:**
- Current capacity: Sequential processing with 100ms delays between inserts
- Limit: Can only process ~10 transactions per second. Batch import of 100+ receipts takes minutes.
- Scaling path: Implement batch inserts instead of sequential. Use Promise.all with concurrency control. Add background job queue.

**Group Member Listing:**
- Current capacity: All members fetched in single query
- Limit: Groups with 1000+ members would create large API response
- Scaling path: Implement pagination for member lists. Add search/filter before fetching. Cache member list.

## Dependencies at Risk

**@google/genai Package:**
- Risk: Beta SDK version (^1.37.0). API may change. SDK improvements critical for expense import feature.
- Impact: Breaking changes would disable AI import feature entirely
- Migration plan: Monitor Gemini API releases. Implement abstraction layer in `src/services/ai.ts` to isolate SDK usage.

**recharts Library:**
- Risk: Used for financial charts but not heavily integrated. Custom chart logic exists alongside library.
- Impact: If removed, would need to replace chart components
- Migration plan: Consolidate charting strategy - either full recharts or full custom. Current mixed approach is confusing.

**Supabase Auth Dependency:**
- Risk: Auth state managed directly by Supabase library. Session invalidation not handled gracefully.
- Impact: Silent auth failures when token expires. No automatic token refresh.
- Migration plan: Implement token refresh logic. Add explicit auth state machine. Test session expiration scenarios.

## Missing Critical Features

**No Error Recovery Mechanism:**
- Problem: Failed transaction imports leave database in inconsistent state. No rollback or retry logic.
- Blocks: Users cannot safely import large batches of transactions. No audit trail of failed imports.
- Impact: Data integrity risks. User frustration with failed operations.

**No Offline Support:**
- Problem: All operations require network connection. No local caching or sync queue.
- Blocks: App unusable on poor connections. Data loss if network drops during operations.
- Impact: Poor UX in real-world conditions (spotty connectivity).

**Missing Input Validation:**
- Problem: Category names, transaction titles, amounts not validated before DB insert
- Blocks: No protection against invalid data from AI or user input
- Impact: Malformed data in database. Potential calculation errors.

**No Audit Logging:**
- Problem: No record of who made what changes when
- Blocks: Cannot trace data modifications. Difficult to debug issues.
- Impact: Compliance and debugging issues.

**No Data Export/Import:**
- Problem: No way for users to backup or migrate data
- Blocks: Data lock-in. Users trapped if they want to switch services.
- Impact: User retention issues.

## Test Coverage Gaps

**Zero Unit Tests:**
- What's not tested: Entire application has no test files. All business logic untested.
- Files: No test files found in codebase
- Risk: Critical logic (balance calculations, expense import, split logic) can break silently
- Priority: HIGH - Essential for reliability

**No Component Tests:**
- What's not tested: React components, especially forms and modals
- Files: Complex components like `src/features/groups/pages/GroupDetails.tsx`, `src/features/expenses/pages/ImportExpenses.tsx`, `src/features/auth/pages/Onboarding.tsx`
- Risk: UI regressions go unnoticed
- Priority: HIGH

**No Integration Tests:**
- What's not tested: End-to-end flows (create group → add expense → settle debts)
- Risk: Complex user journeys break without detection
- Priority: MEDIUM

**No API/Hook Tests:**
- What's not tested: Supabase interactions, context hooks, custom hooks
- Files: `src/features/expenses/hooks/useTransactions.ts`, `src/context/GroupsContext.tsx`, `src/features/dashboard/hooks/usePersonalTransactions.ts`
- Risk: Data fetching logic has silent failures
- Priority: MEDIUM

**No AI Service Tests:**
- What's not tested: Gemini integration, error handling, model selection fallbacks
- Files: `src/services/ai.ts`
- Risk: AI import feature brittleness unknown
- Priority: MEDIUM

## Architectural Concerns

**Mixed Responsibility in Contexts:**
- Problem: GroupsContext does both data fetching and business logic (CRUD operations)
- Files: `src/context/GroupsContext.tsx`
- Impact: Testing difficult. Logic not reusable outside React context.
- Fix: Create separate service layer for group operations.

**Weak Component Separation:**
- Problem: Feature components contain too much inline logic instead of using service/hook abstractions
- Files: `src/features/groups/pages/GroupDetails.tsx`, `src/features/expenses/pages/ImportExpenses.tsx`
- Impact: Code reuse impossible. Testing painful.
- Fix: Extract business logic to custom hooks and services.

**Inconsistent Error Handling:**
- Problem: Some places use try-catch with logging, others swallow errors silently
- Files: Throughout codebase
- Impact: Bugs hidden from developers. Poor user error messaging.
- Fix: Implement consistent error handling pattern with structured logging.

---

*Concerns audit: 2026-01-21*
