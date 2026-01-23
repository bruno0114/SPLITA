# External Integrations

**Analysis Date:** 2026-01-23

## APIs & External Services

**Google Gemini AI:**
- Gemini for financial analysis and AI-powered expense extraction
  - SDK/Client: @google/genai 1.37.0
  - Models supported: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash, gemini-2.0-flash-exp
  - Auth: `VITE_GEMINI_API_KEY` (system-wide or user-provided per profile)
  - Implementation: `src/services/ai.ts` contains core AI service with model selection, caching, and error handling
  - Features:
    - Financial health analysis with daily caching
    - Expense extraction from images/PDFs with structured JSON response
    - Dynamic model discovery and smoke testing for API key validation

**Google OAuth:**
- Social authentication provider
  - Auth: Supabase-managed OAuth through Google
  - Redirect: Configured to `/onboarding` on successful sign-in
  - Implementation: `src/features/auth/hooks/useAuth.ts` with `signInWithGoogle()` method

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: `VITE_SUPABASE_URL` (https://knhbsufwidbtyicahaku.supabase.co)
  - Client: @supabase/supabase-js (v2.78.0)
  - Real-time subscriptions enabled via WebSocket

**Key Tables:**
- `profiles` - User profiles with full_name, avatar_url, gemini_api_key, email
- `groups` - Expense groups with currency, invite_code, created_by
- `group_members` - Group membership relationships
- `transactions` - Group transactions with splits, amounts, categories, dates
- `transaction_splits` - Split breakdown per transaction per user
- `personal_transactions` - User's personal income/expense transactions
- `categories` - User-defined and system categories with icons/colors
- `daily_insights` - Cached AI-generated daily financial advice (per user, per date)
- `user_settings` - User preferences (usage_type, detect_recurring, split_default)
- `ai_history` - History of AI-processed file uploads and extractions

**File Storage:**
- Local filesystem only
  - Image processing via client-side utilities in `src/lib/image-utils.ts`
  - Files sent to Gemini as base64 encoded data in requests
  - No external file storage service (S3, etc.) currently used

**Caching:**
- In-memory model cache in `src/services/ai.ts` (modelCache Map)
- Supabase database for daily financial advice (daily_insights table)
- Browser localStorage for:
  - Theme preference (system/dark/light)
  - Onboarding state (pending_onboarding)
  - Redirect paths (splita_redirect_path)

## Authentication & Identity

**Auth Provider:**
- Supabase Authentication (PostgreSQL-based)
  - Implementation: `src/features/auth/context/AuthContext.tsx` for state management
  - Methods: Google OAuth, email/password sign-up, email/password sign-in

**Sessions:**
- Supabase session management with automatic refresh
- Browser persistence via Supabase client defaults
- Hook: `src/features/auth/hooks/useAuth.ts` provides sign-in/sign-up functions

**User Metadata:**
- Social login metadata (full_name, picture from Google provider)
- Auto-sync to profile on first login if missing
- Per-user Gemini API key storage in profiles.gemini_api_key

## Monitoring & Observability

**Error Tracking:**
- None configured (no Sentry, Rollbar, etc.)
- Console.log/console.error used throughout

**Logs:**
- Browser console logging:
  - `[AI Service]` prefix in `src/services/ai.ts`
  - `[useTransactions]` prefix in transaction hooks
  - No centralized logging service

## CI/CD & Deployment

**Hosting:**
- Not configured in codebase (supports any static host)
- Commonly used with: Vercel, Netlify, AWS S3 + CloudFront, etc.

**CI Pipeline:**
- None configured (no GitHub Actions, GitLab CI, etc.)

**Build Process:**
- Vite build command: `npm run build`
- Output to `dist/` directory

## Environment Configuration

**Required env vars:**
```
VITE_SUPABASE_URL              # https://knhbsufwidbtyicahaku.supabase.co
VITE_SUPABASE_ANON_KEY         # JWT token for anonymous access
VITE_GEMINI_API_KEY            # Optional default system key; users can override in settings
```

**Secrets location:**
- `.env` file (git-ignored, not committed)
- Supabase keys also accessible via Supabase dashboard

## Webhooks & Callbacks

**Incoming:**
- None currently implemented

**Outgoing:**
- None currently implemented
- Google OAuth redirects handled via window.location.origin + path

## Real-Time Features

**Supabase Subscriptions:**
- onAuthStateChange - Listens for login/logout events in AuthContext
- Real-time DB subscriptions not currently used (polling-based data fetching)

## API Rate Limiting & Quotas

**Gemini API:**
- Model validation includes quota error detection
- Friendly error message if quota exceeded: "Se ha superado la cuota de uso"
- Implementation: `src/services/ai.ts` with code 'RATE_LIMIT'

**Supabase:**
- Row-level security (RLS) policies configured for:
  - Transaction access (user must be group member or creator)
  - Profile access (users can read/write own profile)
  - Group access restrictions
- RLS policies defined in SQL migrations (see `supabase_*_rls_*.sql` files)

## Data Models & Type System

**Core Types:** `src/types/index.ts`
- User - id, name, avatar, email, occupation
- Transaction - id, date, merchant, category, amount, payer, splitWith, original_amount, original_currency, exchange_rate, is_recurring
- PersonalTransaction - user_id, title, amount, category, type (income/expense), date, payment_method
- Category - id, user_id, name, icon, color, bg_color, is_system
- Group - id, name, type (trip/house/couple/other), members, userBalance, currency, lastActivity, image, inviteCode, createdBy
- Insight - id, title, description, icon, type (saving/alert/info)

## Integration Patterns

**Data Flow:**
1. User authenticates via Supabase Auth (Google OAuth or email/password)
2. Profile loaded from Supabase on session establishment
3. Groups/transactions fetched from Supabase via React Context (GroupsContext, useTransactions)
4. AI requests to Gemini include user's personal API key (if set) or system default
5. AI results cached in Supabase (daily_insights) to reduce quota usage
6. Expense extraction stores results in ai_history table for user reference

**Error Handling:**
- Supabase errors: Checked on every query, wrapped in try-catch
- Gemini errors: Translated to user-friendly Spanish messages (INVALID_KEY, NO_SUITABLE_MODEL, RATE_LIMIT, etc.)
- Permission errors: RLS violations return "PERMISSION_DENIED" message

---

*Integration audit: 2026-01-23*
