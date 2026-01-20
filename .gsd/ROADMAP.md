# ROADMAP.md

> **Current Milestone**: v1 – Real User Onboarding, Auth & Group Collaboration
> **Goal**: Transition from a functional prototype to a production-ready application where real users can sign up, join groups via links, and manage their own AI scan configs.

## Must-Haves
- [ ] **Functional Onboarding**: 6-step flow persists to Supabase (profile/group/pre-settings).
- [ ] **Group Invitations**: Working "Share Link" -> "Auto Join" flow for new and existing users.
- [ ] **Social Auth**: Google and Facebook login working and documented.
- [ ] **Data Integrity**: Zero mock data leakage for real users.
- [ ] **AI Key Management**: UI to store/edit `GEMINI_API_KEY` (client-side persistence).

## Phases

### Phase 1: Authentication & Onboarding Persistence
**Status**: ⬜ Not Started
**Objective**: Ensure the 6-step onboarding flow isn't just visual.
**Deliverables**:
- Persist "Step 2: Usage Type" to user metadata or profile.
- Persist "Step 3: Create Group" and "Step 4: Add People" to Supabase tables.
- Persist "Step 5: Settings" to user preferences.
- Implement Social Login redirects and configuration.

### Phase 2: Group Invitation System
**Status**: ⬜ Not Started
**Objective**: Enable viral growth via shareable links.
**Deliverables**:
- Backend logic/edge functions (or simple client-side link handling) to join a group via ID.
- "Join" page to handle incoming invite links.
- Auto-join logic after Auth redirect (handling the 'next' parameter).

### Phase 2: Avatars & CRUD Synchronization
- [x] Create Supabase Storage bucket `avatars` with RLS policies
- [x] Implement client-side WebP compression utility
- [x] Integrate image upload in Settings page
- [x] Fix non-awaited refresh calls in `usePersonalTransactions` and `useGroups`
- [x] Synchronize profile creation in Supabase trigger (fix 406 errors)

### Phase 3: AI UX & API Key Management
**Status**: ⬜ Not Started
**Objective**: Secure and user-scoped Gemini API usage.
**Deliverables**:
- "IA Settings" screen inside the Settings feature.
- Secure local/metadata storage for the user's API Key.
- Graceful error handling in `ImportExpenses` when key is missing/invalid.

### Phase 4: Production Data Clean-up
**Status**: ⬜ Not Started
**Objective**: Remove all "MOCK_DATA" references from the main user path.
**Deliverables**:
- Replace remaining hardcoded lists with Supabase queries.
- Implement proper "Empty States" for fresh accounts.
- Final RLS Audit to ensure data isolation.

### Phase 5: Verification & Launch Docs
**Status**: ⬜ Not Started
**Objective**: Final polish and setup guides.
**Deliverables**:
- End-to-end video walkthrough of the onboarding/invite flow.
- Setup Guide for Social Auth (Supabase + Providers).
- Environment Variables template update.
