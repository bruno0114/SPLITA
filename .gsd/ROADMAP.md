# ROADMAP.md

> **Current Milestone**: Phase 4 - Core UX & Data Integrity Fixes
> **Goal**: Stabilize core flows for real usage by fixing RLS blockers, improving AI key management, and enabling personal vs group imports.

## Must-Haves
- [ ] **RLS Stability**: Fix "infinite recursion" in group_members and ensure reliable group creation.
- [ ] **AI Key Lifecycle**: Support removing and re-adding Gemini API keys with immediate UI feedback.
- [ ] **Flexible AI Import**: Let users choose between "Personal Finances" or a specific "Group" during AI scan review.
- [ ] **Data Integrity**: Ensure imported records end up in the correct tables (personal_transactions vs transactions).

## Phases

### Phase 1: Authentication & Onboarding Persistence
**Status**: ⬜ Not Started
**Objective**: Ensure the 6-step onboarding flow isn't just visual.

### Phase 2: Avatars & Group Invites
**Status**: 🚧 Partial
**Objective**: Fix CRUD sync and implement link-based joining.

### Phase 3: AI UX & API Key Management
**Status**: ✅ Complete
**Objective**: Secure and user-scoped Gemini API usage.

### Phase 4: Core UX & Data Integrity Fixes
**Status**: ✅ Complete
**Objective**: Stabilize the core flows for real-world production usage.
**Deliverables**:
- Fix RLS recursion in `group_members` policy.
- Add "Clear API Key" functionality to `AISettings.tsx`.
- Update `ImportExpenses.tsx` to support context selection (Group vs Personal).
- Ensure `useTransactions` and `usePersonalTransactions` are correctly targeted based on import context.

### Phase 5: Production Data Clean-up
**Status**: ⬜ Not Started
**Objective**: Remove remaining mock data and finalize launch documentation.
