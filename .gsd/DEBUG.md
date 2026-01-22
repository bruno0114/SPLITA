# Debug Session: Join Group UI & Flickering

## Symptom
1. **Unauthenticated Access to Internal UI:** Users accessing the "Join Group" link (`/unirse/:code`) see the full authenticated application layout (Sidebar, Header, BottomNav) even if they are not logged in.
2. **Flickering/Blinks:** "2 blinks" observed when logging in or redirecting during the join flow.

## Evidence
- **App.tsx:** The `Sidebar`, `Header`, and `BottomNav` are rendered **unconditionally** for all routes except `Login` and `Onboarding` (`isAuthRoute`).
  ```typescript
  // App.tsx
  const isAuthRoute = location.pathname === AppRoute.LOGIN || location.pathname === AppRoute.ONBOARDING;
  // ...
  if (isAuthRoute) return <Routes ... />;
  // ...
  return (
    <div>
      <Sidebar />
      <Header />
      <main>
        <Routes>
           <Route path="/unirse/:inviteCode" element={<JoinGroup />} />
        </Routes>
      </main>
    </div>
  )
  ```
- **JoinGroup.tsx:** Handles the "Join" logic. If not logged in, it redirects to Login manually when the user clicks the button.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | **Layout Logic:** `App.tsx` does not exclude `/unirse/*` from the main authenticated layout, causing the sidebar/header to appear. | 100% | PENDING_FIX |
| 2 | **Flickering Cause:** The "blink" might be caused by the `syncOnboarding` effect in `App.tsx` or the redirect logic in `useEffect` firing/re-rendering when `user` state changes or when navigating back from Login. | 70% | UNTESTED |

## Proposed Solution (Analysis Phase)
1. **Fix Layout:** Update `isAuthRoute` in `App.tsx` to include `/unirse/` paths, or create a separate "Public Layout" for such pages.
2. **Smooth Onboarding:** Design a standalone "Join Group" screen that aligns with the Onboarding UI (clean, centered, no sidebar) to guide the user.

## Design Proposal (Creative Screen)
- **Concept:** "Welcome to the Group" card similar to Onboarding.
- **Background:** Dynamic/Clean background (like Login/Onboarding).
- **Content:**
  - Group Avatar (Large)
  - Group Name
  - "Invited by [User]" (if available)
  - Call to Action: "Join to see expenses"
  - If not logged in: "Login/Register to join"
