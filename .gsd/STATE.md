# STATE.md

## Current Position
- **Phase**: 14 (Final Audit & Production Hardening)
- **Task**: Code Hygiene Complete
- **Status**: ✅ COMPLETE

## Accomplished (Phase 14)
- ✅ **Social Login Sync**: `useProfile.ts` now syncs `full_name` and `avatar_url` from OAuth metadata to `profiles` table.
- ✅ **Avatar Consistency**: `Sidebar.tsx` and `Header.tsx` now display user info from `profiles` (single source of truth).
- ✅ **Flexible Image Compression**: `compressToWebP` now accepts optional `maxSize` param (400px avatars, 800px group covers).
- ✅ **Post-OAuth Onboarding**: `App.tsx` syncs onboarding data from `localStorage` after social login redirect.
- ✅ **Code Hygiene**: Removed all dead mock data:
  - Cleaned `constants.ts` (removed CURRENT_USER, GROUP_MEMBERS, MOCK_TRANSACTIONS, INSIGHTS, MOCK_GROUPS)
  - Removed unused imports from `ImportExpenses.tsx` and `Onboarding.tsx`

## Build Status
- ✅ Production build successful (1.4MB bundle)
- ⚠️ Vite warning about mixed dynamic/static imports for `supabase.ts` (non-blocking)
- ⚠️ Bundle size warning (>500KB) — code splitting recommended for future optimization

## Next Steps (Future Phases)
1. Implement code-splitting with `React.lazy()` for heavy routes (Categories, Settings, GroupDetails)
2. Address Supabase security advisories (`function_search_path_mutable`, `rls_disabled_in_public`)
3. Production deployment and environment configuration
