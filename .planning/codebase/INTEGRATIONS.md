# External Integrations

**Analysis Date:** 2025-01-20

## APIs & External Services

**Supabase (Backend-as-a-Service):**
- SDK: `@supabase/supabase-js` 2.78.0
- Client: `src/lib/supabase.ts`
- Auth: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Used for: Authentication, PostgreSQL database, Row Level Security

**Google Gemini AI:**
- SDK: `@google/genai` 1.37.0
- Client: `src/services/ai.ts`
- Auth: User-provided API key stored in `profiles.gemini_api_key` column
- Used for:
  - Expense extraction from receipt images/PDFs (`extractExpensesFromImages`)
  - Financial health analysis and personalized advice (`analyzeFinancialHealth`)
- Models: Auto-selects from `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`, `gemini-2.0-flash-exp`

## Data Storage

**Database:**
- Provider: Supabase (PostgreSQL)
- Connection: Via Supabase JS client with env vars
- Client: Direct Supabase client queries

**Database Tables:**
- `profiles` - User profile data including `gemini_api_key`
- `groups` - Expense sharing groups
- `group_members` - Group membership (user_id, group_id, role)
- `transactions` - Group transactions
- `transaction_splits` - How transactions are split between members
- `personal_transactions` - Individual user transactions (not shared)

**Row Level Security (RLS):**
- Enabled on all tables
- Custom function `check_is_group_member()` for membership verification
- Policies defined in `supabase_rls_fix.sql`

**File Storage:**
- Supabase Storage (referenced for group images via `image_url`)
- Configuration in `supabase_storage_fix.sql`

**Caching:**
- In-memory model cache for verified Gemini models (`src/services/ai.ts`)
- No external caching service

## Authentication & Identity

**Auth Provider:**
- Supabase Auth

**Supported Methods:**
- Email/Password (`signInWithPassword`, `signUp`)
- Google OAuth (`signInWithOAuth` with provider: 'google')
- Facebook OAuth (`signInWithOAuth` with provider: 'facebook')

**Implementation:**
- `src/features/auth/context/AuthContext.tsx` - React context for auth state
- `src/features/auth/hooks/useAuth.ts` - Auth actions and state hook
- `src/components/layout/ProtectedRoute.tsx` - Route protection

**Session Management:**
- Supabase handles JWT sessions automatically
- `supabase.auth.getSession()` for initial load
- `supabase.auth.onAuthStateChange()` for realtime updates

## Monitoring & Observability

**Error Tracking:**
- None (console.error only)

**Logs:**
- Browser console logging
- Prefixed logs: `[AI Service]`, `[useGroups]`, `[usePersonalTransactions]`

## CI/CD & Deployment

**Hosting:**
- Not configured (Vite outputs static files to `dist/`)
- Compatible with: Vercel, Netlify, Cloudflare Pages, any static host

**CI Pipeline:**
- None detected

## Environment Configuration

**Required Environment Variables:**
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

**Optional Environment Variables:**
```
VITE_GEMINI_API_KEY=<default-gemini-key>  # Fallback if user hasn't configured
```

**Secrets Location:**
- `.env` file (gitignored)
- User API keys stored in Supabase `profiles` table

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## OAuth Redirect URLs

**Google OAuth:**
- Redirect: `${window.location.origin}/onboarding`

**Facebook OAuth:**
- Redirect: `${window.location.origin}`

## API Usage Patterns

**Supabase Query Pattern:**
```typescript
// Example from src/features/groups/hooks/useGroups.ts
const { data, error } = await supabase
    .from('groups')
    .select(`
        *,
        members:group_members (
            profiles (id, full_name, avatar_url)
        )
    `)
    .in('id', groupIds)
    .order('created_at', { ascending: false });
```

**Gemini AI Pattern:**
```typescript
// Example from src/services/ai.ts
const ai = new GoogleGenAI({ apiKey });
const result = await ai.models.generateContent({
    model: modelName,
    contents: [{ role: 'user', parts }],
    config: {
        responseMimeType: "application/json",
        responseSchema: schema,
    }
});
```

## Integration-Specific Configuration

**Gemini Model Selection:**
- Automatically discovers available models via `ai.models.list()`
- Performs smoke test on each candidate model
- Caches working model per API key
- Priority order: stable models first, then experimental

**Supabase RLS:**
- Uses `SECURITY DEFINER` function to prevent infinite recursion
- Cascade deletes configured for groups -> members -> transactions

---

*Integration audit: 2025-01-20*
