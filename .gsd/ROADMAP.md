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

### Phase 11.5: Refined Financial UX & Bulk Actions
**Status**: ✅ Complete
**Objective**: Bulk Actions (Toolbar), Context Badges, and Payment Markers (Recurrence/Installments). Refactor all selectors to `PremiumDropdown`.

### Phase 11.6: Advanced Browsing & Insights
**Status**: ✅ Complete
**Objective**: Premium filters (Range DatePicker), Infinite Scroll, Stacked Bar Charts for spending evolution, and Category hygiene (duplicate merge).

### Phase 12: Deep Personalization & Premium AI Ecosystem
**Status**: ✅ Complete
**Objective**: Per-user group categorization, Advanced Projections Modal (Crypto/ETFs projections for 6m-10y), Daily AI advice caching, and API key validation UX.

### Phase 12.5: UI Consistency & Premium Components
**Status**: ✅ Complete
**Objective**: Unified modal animations (Framer Motion) across the app and high-fidelity custom PremiumDatePicker for premium UX.

### Phase 13: UX Refinement & Mobile Optimization
**Status**: ✅ Complete
**Objective**: Redesign Transaction Modal for ergonomics, fix focus ring clipping, and ensure "pixel perfect" responsiveness (especially BottomNav overlap).
- [x] **Transaction Modal Redesign**: 2-column grid, compact type toggle, reduced height.
- [x] **Focus Ring Fix**: Adjust padding/box-model to prevent clipping of input highlights.
- [x] **Mobile Responsive Audit**: Fix BottomNav overlap and safe area handling.
- [x] **Mobile Action Menu**: Standardize mobile "+" button modal animation with Framer Motion.
- [x] **Modal Consistency**: Ensure all modals (including AI History details) use the unified animation pattern.

### Phase 14: Final Audit & Production Hardening
**Status**: ✅ Complete
**Objective**: Guarantee avatar consistency across the app, social login sync, and overall performance/code hygiene.
- [x] **Avatar Consistency**: Sidebar, Header, Settings now display avatar from `profiles` table.
- [x] **Social Login Sync**: `useProfile.ts` syncs OAuth metadata (Google picture) to `profiles` table automatically.
- [x] **Manual Upload Compression**: `compressToWebP` supports flexible `maxSize` param (400px avatars, 800px covers).
- [x] **Code Hygiene**: Removed all mock data from `constants.ts`, cleaned dead imports.
- [x] **Post-OAuth Onboarding**: `App.tsx` handles pending onboarding data from `localStorage` after redirect.

### Phase 15: UX Hardening, Onboarding Flow & Responsive Redesign
**Status**: 🚧 In Progress
**Objective**: Comprehensive mobile-first overhaul, fixing layout overlaps, smart routing logic, and modernizing Groups/Dashboard UI for small screens.
- [ ] **Smart Routing**: Implement `has_visited` logic to distinguish New (Onboarding) vs Returning (Login) users.
- [ ] **Mobile Layout Fixes**: `min-h-[100dvh]` for auth screens, fix BottomNav overlapping modals (`z-index`, padding).
- [ ] **Groups Mobile Redesign**: Convert table rows to "Card" stack for vertical readability on mobile.
- [ ] **Categories Mobile Access**: Ensure categories are accessible and visible on small screens.
- [ ] **Dashboard UX**: Enhance filter tabs (client-side switch) and fix Calendar/Floating Action Button overlaps.