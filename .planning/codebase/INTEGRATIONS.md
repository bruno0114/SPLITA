# External Integrations

**Analysis Date:** 2026-01-21

## APIs & External Services

**Google Generative AI (Gemini):**
- Expense extraction from receipts and images
  - SDK/Client: `@google/genai` 1.37.0
  - Auth: User-provided API key or system default via `VITE_GEMINI_API_KEY`
  - Implementation: `src/services/ai.ts`
  - Models: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash (with experimental fallback)
  - Uses: Schema-based extraction for structured transaction data

- Financial health analysis
  - Function: `analyzeFinancialHealth()` in `src/services/ai.ts`
  - Analyzes monthly income, expenses, savings rate
  - Generates 3 actionable financial tips in Spanish (Argentine context)

- Daily financial advice
  - Function: `getDailyAdvice()` in `src/services/ai.ts`
  - Cached per user per day in Supabase `daily_insights` table
  - Falls back to cached version if available, regenerates on force refresh

**DolarAPI:**
- Exchange rate data for ARS/USD
  - Endpoint: `https://dolarapi.com/v1/dolares` (all rates)
  - Endpoint: `https://dolarapi.com/v1/dolares/blue` (blue market rate)
  - Implementation: `src/services/dolar-api.ts`
  - Used in: `src/features/expenses/components/TransactionModal.tsx`, `src/features/expenses/pages/ImportExpenses.tsx`
  - No authentication required

**UI Avatars Service:**
- Placeholder user avatars
  - Endpoint: `https://ui-avatars.com/api/?name={name}&background={color}&color={color}`
  - Used in: Header, Sidebar, Settings components
  - Fallback when user profile avatar not available

## Data Storage

**Databases:**
- PostgreSQL via Supabase
  - Connection: `VITE_SUPABASE_URL` (hosted at supabase.co)
  - Client: `@supabase/supabase-js`
  - Location: `src/lib/supabase.ts`

**Key Tables:**
- `profiles` - User profile data (full_name, avatar_url, email, gemini_api_key, updated_at)
  - Accessed via: `src/features/settings/hooks/useProfile.ts`
  - RLS policies for data isolation per user

- `transactions` - Expense transactions for groups
  - Fields: group_id, payer_id, title, amount, category, date, created_by, original_amount, original_currency, exchange_rate, is_recurring, recurring_pattern
  - Accessed via: `src/features/expenses/hooks/useTransactions.ts`

- `transaction_splits` - Individual user portions of shared expenses
  - Fields: transaction_id, user_id, amount_owed, paid, category
  - Linked to transactions via foreign key

- `groups` - Expense sharing groups
  - Accessed via: `src/features/groups/hooks/useGroups.ts`

- `daily_insights` - Cached daily financial advice
  - Fields: user_id, date, content (JSON array of strings)
  - Upsert pattern with conflict on (user_id, date)
  - Accessed via: `src/services/ai.ts`

**File Storage:**
- User avatars and profile images stored via Supabase storage (profile.avatar_url references)

**Caching:**
- In-memory model cache for Gemini API keys: `modelCache` Map in `src/services/ai.ts`
- Clears on API key update via `clearModelCache()`
- Database-backed caching for daily insights (Supabase `daily_insights` table)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (custom JWT-based)
  - Implementation: `src/features/auth/context/AuthContext.tsx`
  - OAuth provider: Google (via Supabase)
  - Session storage via Supabase local storage

**Auth Flow:**
1. `supabase.auth.signInWithOAuth({ provider: 'google' })` initiates OAuth
2. Redirect to `/onboarding` after successful auth
3. `supabase.auth.getSession()` retrieves active session
4. `supabase.auth.onAuthStateChange()` listener tracks auth state changes
5. Session stored in browser via Supabase SDK (localStorage by default)

**Hooks:**
- `useAuth()` in `src/features/auth/hooks/useAuth.ts` - Get user, session, loading state
- `useAuthContext()` in AuthContext - Provider for auth state
- `useProfile()` in `src/features/settings/hooks/useProfile.ts` - User profile data with social login sync

## Monitoring & Observability

**Error Tracking:**
- Not detected

**Logs:**
- Console logging via `console.log()` and `console.error()` throughout:
  - AI service operations: `[AI Service]` prefix in `src/services/ai.ts`
  - Transaction operations: `[useTransactions]` prefix in hooks
  - DolarAPI: `[DolarAPI]` prefix
- No centralized logging service detected

## CI/CD & Deployment

**Hosting:**
- Client-side SPA deployment (Vite build output)
- Development: `npm run dev` (Vite dev server on port 3000)
- Build: `npm run build` (Vite production build)
- Preview: `npm run preview` (preview built assets)

**CI Pipeline:**
- Not detected (no .github/workflows, no CI config files found)

**Deployment Target:**
- Any static hosting (Vercel, Netlify, GitHub Pages, etc.)
- Supabase backend (managed cloud, no deployment needed)

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` - Supabase project endpoint
- `VITE_SUPABASE_ANON_KEY` - Supabase client API key
- `VITE_GEMINI_API_KEY` - Google Generative AI API key (optional system default, can be overridden per user)

**Secrets location:**
- `.env` file (local development only)
- Environment variables in production hosting platform
- User-provided Gemini API key stored in `profiles.gemini_api_key` (Supabase)

**Development Environment:**
- Vite loads env vars from `.env` file with `VITE_` prefix
- Vite config in `vite.config.ts` exposes vars via `import.meta.env.VITE_*`

## Webhooks & Callbacks

**Incoming:**
- OAuth redirect callback from Google: Redirects to `/onboarding` after login
- Supabase auth state change subscription: Real-time listener via `onAuthStateChange()`

**Outgoing:**
- None detected

## Data Integration Patterns

**Transaction Extraction:**
- User uploads receipt image/PDF to AI expense import
- `extractExpensesFromImages()` calls Gemini API with image + structured schema
- Returns array of parsed transactions with date, merchant, category, amount, currency
- User reviews and confirms extracted data
- `useTransactions.addTransaction()` inserts to Supabase with splits

**Real-time Data Sync:**
- Supabase real-time subscriptions not explicitly configured
- Data fetched on component mount via hooks (e.g., `useTransactions`, `useProfile`)
- Manual refresh via `fetchTransactions()`, `refreshProfile()` functions

**Currency Conversion:**
- DolarAPI provides ARS/USD rates
- Transaction can store `original_amount`, `original_currency`, `exchange_rate`
- Used when adding transactions with foreign currency

---

*Integration audit: 2026-01-21*
