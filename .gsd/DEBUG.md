# Debug Session: Group UX Issues (Delete & Overlay)

## Symptom 1: Misleading Delete Success
- **Expected:** Deleting a restricted item shows an error.
- **Actual:** UI shows "Gasto eliminado" toast, but item persists.
- **Evidence:** User screenshot (Step 434) shows the toast "Gasto eliminado" with the transaction "Test" (paid by Adolfo) still visible.
- **Root Cause Hypothesis:** 
  1. `count: exact` is not working as expected (returns undefined or 1 even if blocked?).
  2. The hook is not throwing the error in a way that the UI catches it before the success toast.
  3. `PersonalFinance.tsx` or `GroupDetails.tsx` have logic gaps.

## Symptom 3: Modal Overlap
- **Expected:** Modals should be on the top-most layer.
- **Actual:** "Ajustes del Grupo" modal is being overlapped by an overlay.
- **Evidence:** User provided HTML shows `z-index: 2` on modal content.
- **Root Cause Hypothesis:** `z-index` (100) is too low for some stacking contexts or global layout elements.

## Attempts & Resolution

### Symptom 1: Misleading Delete Success
- **Finding**: Supabase `.delete({ count: 'exact' })` was working, but the UI was showing the success toast as long as no `error` was returned. In some RLS scenarios, Supabase might simply return `count: 0` without a hard error if the policy is "silent" or if the logic flow bypassed the explicit error check.
- **Resolution**: Updated hooks to return `count`. Updated UI to check `if (!error && count > 0)`. If `count === 0`, it triggers the permission error modal.
- **Status**: RESOLVED

### Symptom 2: Modal Overlay Rendering
- **Finding**: The `Portal` implementation was wrapping `AnimatePresence`, which caused components to unmount before exit animations could run. This created "popping" and visual artifacts. Also, the backdrop color `bg-black/60` was slightly heavy, contributing to the "opacity 1" (too dark/solid) feel.
- **Resolution**: Refactored to `Portal > AnimatePresence > {show && <Modal />}`. Added unique `key` props to `motion.div`s. Adjusted backdrop to `bg-black/40` and ensured clean stacking with `z-10`.
- **Status**: RESOLVED

### Symptom 3: Modal Overlap
- **Finding**: The `z-index` of the modals (100) was sometimes lower than other layout components (like the sidebar or bulk actions bar in certain contexts).
- **Resolution**: Increased container `z-index` to `1000` and content `z-index` to `50` for all group-related modals in `GroupDetails.tsx` and `InviteModal.tsx`.
- **Status**: RESOLVED
