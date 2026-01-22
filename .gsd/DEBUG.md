# Debug Session: Join Group UI & Flickering

## Symptom
1. **Unauthenticated Access to Internal UI:** Users accessing the "Join Group" link (`/unirse/:code`) see the full authenticated application layout (Sidebar, Header, BottomNav) even if they are not logged in.
2. **Flickering/Blinks:** "2 blinks" observed when logging in or redirecting during the join flow.

## Evidence
- **App.tsx:** The `Sidebar`, `Header`, and `BottomNav` were rendered **unconditionally** for all routes except `Login` and `Onboarding` (`isAuthRoute`).
- The `/unirse/:inviteCode` route was inside the private layout, causing unauthenticated users to see the full app chrome.

## Root Cause
**Confirmed:** The `/unirse/:inviteCode` route was placed inside the private layout section of `App.tsx`, causing the Sidebar/Header/BottomNav to render even for unauthenticated users accessing invite links.

## Resolution

**Fix Applied:** Modified `App.tsx` to treat `/unirse/` and `/join/` paths as public routes.

### Changes Made:
1. **Renamed** `isAuthRoute` to `isPublicRoute` for clarity
2. **Extended** the public route check to include:
   - `/unirse/:inviteCode`
   - `/join/:inviteCode`
3. **Moved** the join routes to the public layout section (rendered without Sidebar/Header/BottomNav)
4. **Removed** duplicate join routes from the private layout section

### Code Change (App.tsx):
```typescript
// Before:
const isAuthRoute = location.pathname === AppRoute.LOGIN || location.pathname === AppRoute.ONBOARDING;

// After:
const isPublicRoute = 
    location.pathname === AppRoute.LOGIN || 
    location.pathname === AppRoute.ONBOARDING ||
    location.pathname.startsWith('/unirse/') ||
    location.pathname.startsWith('/join/');
```

### Flicker Reduction:
- Since the join page now renders in the public layout, there's no mount/unmount of the private chrome during auth transitions
- The redirect logic remains unchanged but now operates within a consistent layout

## Verification Checklist
- [ ] Logged out: open `/unirse/:code` → no Sidebar/Header/BottomNav visible
- [ ] Click join → go to login → complete login → return to `/unirse/:code` without flashing private layout
- [ ] Legacy link `/join/:code` redirects to `/unirse/:code`
- [ ] Protected routes (dashboard) still show Sidebar/Header/BottomNav when logged in

## Status: FIXED ✓
