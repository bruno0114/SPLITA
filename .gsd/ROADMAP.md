# ROADMAP.md

> **Current Milestone**: Core UX, Groups Management & AI Evolution
> **Goal**: Fix group blockers, implement invites, add spending analytics, and upgrade AI import with FX/Per-item control.

## Must-Haves
- [ ] **Group Recovery (P0)**: Functional group editing (settings, image) and working Invite/Join flow.
- [ ] **Navigation (P1)**: Logout accessibility in header (independent of sidebar state).
- [ ] **Categories (P1)**: Spend analytics by category with drilldown to transaction lists.
- [ ] **AI Import v2 (P1)**: Per-item selection (toggles) and currency/FX detection with user confirmation.

## Phases

### Phase 1: Authentication & Onboarding Persistence
**Status**: ⬜ Not Started
**Objective**: Ensure the 6-step onboarding flow isn't just visual.

### Phase 2: Avatars & Basic Sync
**Status**: ✅ Complete
**Objective**: Fix CRUD sync and initial profile setup.

### Phase 3: AI UX & API Key Management
**Status**: ✅ Complete
**Objective**: Secure and user-scoped Gemini API usage.

### Phase 4: Core UX & Data Integrity Fixes
**Status**: ✅ Complete
**Objective**: Stabilize the core flows for real-world production usage.

### Phase 5: Groups Management & Invite Recovery
**Status**: ✅ Complete
**Objective**: Restore group settings (edit/image) and implement join links with proper RLS.

### Phase 6: UX Polish - Navigation & Categories
**Status**: ✅ Complete
**Goal**: Improved navigation and categorization.gout and implement category-based spending reports.

### Phase 7: AI Import Evolution (FX & Selection)
**Status**: ✅ Complete
**Objective**: Implement item-by-item selection and multi-currency detection/conversion.

### Phase 8: AI Premium UX & Import History
**Status**: ✅ Complete
**Objective**: Implement "Stardust" VFX, Argentine personality insights, and persist import history in Supabase Storage.

### Phase 9: Expert Financials & Analytics
**Status**: ✅ Complete
**Objective**: Multi-mode splitting, debt simplification algorithm, and creative projection charts.

### Phase 10: Deep History & Real-time FX (DolarAPI)
**Status**: ✅ Complete
**Objective**: Interactive AI history details, PDF/Image support differentiation, and global currency sync via DolarAPI with creative animations.

### Phase 11: Expert Categories & UI Refactor (Premium Controls)
**Status**: 🚧 In Progress
**Objective**: CRUD for categories in Supabase, paginated drill-down for category stats, and global replacement of native selects with custom PremiumDropdowns.

### Phase 12: Production Readiness & Clean-up
**Status**: ⬜ Not Started
**Objective**: Remove remaining mock data and finalize launch documentation.