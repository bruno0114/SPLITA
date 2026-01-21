# Debug Session: BulkActionsBar UI Optimization

## Symptom
1. **Overlap**: On mobile, the `BulkActionsBar` (Stitch style) is partially covered by the floating `+` button in the center of the bottom navigation.
2. **Desktop Size**: On larger screens, the circular floating bar feels too small and "surgical" for the available space.

**When**: Occurs when movements are selected.
**Expected**: 
- Mobile: The bar should be positioned high enough to clear the `+` button or the `+` button should not overlap.
- Desktop: The bar should be wider or more proportional to the screen.
**Actual**: 
- Mobile: The `+` button z-index or absolute position covers the central re-assignment dropdown.
- Desktop: Min-width is fixed at 300px which looks tiny on 1920px screens.

## Hypotheses
| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | Increasing `bottom` offset on mobile will clear the `+` button. | 90% | UNTESTED |
| 2 | Using `md:min-w-[450px]` or similar will improve desktop presence. | 100% | UNTESTED |
| 3 | Reducing the scale/padding of the bottom `Navbar` will help mobile layout. | 70% | UNTESTED |
