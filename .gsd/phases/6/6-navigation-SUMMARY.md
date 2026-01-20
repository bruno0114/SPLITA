# Plan 6.1 Summary: Navigation Polish

## Completed Tasks
1. **Update App Routes & Types**
   - Added `AppRoute.CATEGORIES`.
   - Updated `App.tsx` routing and title logic.
   - Added placeholder route for `/categories`.

2. **Add Categories to Sidebar**
   - Added `NavItem` for Categories with `PieChart` icon.
   - Verified generic `NavItem` component handles it correctly.

3. **Add Desktop Logout to Header**
   - Added `LogOut` button to desktop header.
   - Ensured visibility only on desktop (`hidden md:flex`).

## Verification
- [x] Logout accessible on desktop header.
- [x] Sidebar links to `/categories`.
- [x] App handles `/categories` route.
