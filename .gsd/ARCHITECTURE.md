# Architecture

> Updated on 2026-01-20 - Focus: UI/UX Standardization

## Overview
SPLITA uses a feature-based architecture. A key focus is the "Premium" feel achieved through glassmorphism and motion.

## UI Components Standards
- **Dropdowns**: `PremiumDropdown.tsx` (Custom UI).
- **DatePickers**: `PremiumDatePicker.tsx` (Currently native, TARGET: Custom UI).
- **Modals**:
  - Unified Animation Pattern (Framer Motion):
    - Backdrop: `opacity: 0` -> `1`.
    - Content: `scale: 0.95`, `y: 20` -> `scale: 1`, `y: 0`.

## Modals Identification & Status
- [ ] `TransactionModal.tsx`: Native Tailwind animation. (Migration pending)
- [✅] `HistoryDetailModal.tsx`: Standard Framer Motion.
- [ ] `InviteModal.tsx`: Native Tailwind animation. (Migration pending)
- [ ] `CategoryManagerModal.tsx`: Native Tailwind animation. (Migration pending)
- [✅] `ProjectionsModal.tsx`: Framer Motion.
- [✅] `SubscriptionModal.tsx`: Framer Motion.

## Technical Debt Items (Phase 13 Focus)
- Unify all modal components to use the same `motion` wrapper.
- Eliminate native HTML date inputs in favor of `PremiumDatePicker` custom UI.
