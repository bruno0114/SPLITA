━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► DISCUSS PHASE 15: UX Polish & Responsive Overhaul
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase: UX Hardening, Onboarding Flow & Responsive Redesign
Objective: Fix responsive issues, implement smart routing (New vs Returning), polish Onboarding, and perform a comprehensive mobile layout fix.

───────────────────────────────────────────────────────

TOPICS TO DISCUSS

1. SMART ROUTING LOGIC
   - **Strategy**: Implement `localStorage` based routing ("New" vs "Returning").
   - **Flow**:
     - No session + No history → `/onboarding`.
     - No session + History → `/login`.
     - Session → Dashboard.

2. RESPONSIVE & LAYOUT OVERHAUL (CRITICAL)
   - **Login/Onboarding**:
     - Switch to `min-h-[100dvh]` to fix viewport height issues.
     - Remove "Close" button in Onboarding.
   - **Sofftware-wide Z-Index & Layout**:
     - **Issue**: Bottom Navbar overlaps modals.
     - **Fix**: Ensure Modals use `z-50` and BottomNav uses `z-40`, OR add `pb-[bottom-nav-height]` to modal containers so content scroll doesn't get cut off.
   - **Categories**:
     - **Issue**: Hidden on mobile.
     - **Fix**: Add entry point in BottomNav or "More" menu, or ensure the page renders correctly in the mobile viewport.
   - **Groups Screen**:
     - **Redesign**: Convert table/list rows into "Card" format for mobile (Vertical stack).
     - **Visuals**: Fix alignment and spacing of movements.
   - **Dashboard / Personal Finance**:
     - **Filters (Tabs)**: Prevent page reload/scroll-to-top when switching between All/Expenses/Income.
     - **Calendar**: Fix overlapping with the "Add Transaction" CTA/Container.

3. MOBILE-SPECIFIC UI PATTERNS
   - **Cards vs Tables**: Default to Card view for complex data on mobile.
   - **Touch Targets**: Ensure buttons are accessible (min 44px).

4. VERIFICATION PLAN
   - **Device Testing**: Verify on iPhone (Safari) and Android (Chrome) viewports.
   - **Interaction Testing**: Scroll behavior in modals, tab switching, and input focus visibility.

───────────────────────────────────────────────────────
