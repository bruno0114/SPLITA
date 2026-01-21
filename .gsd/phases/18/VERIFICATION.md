---
phase: 18.2
verified_at: 2026-01-21T20:55:00-03:00
verdict: PARTIAL
---

# Phase 18.2 Verification Report

## Summary
Logic verification completed via static code analysis and instrumentation. Manual test required to confirm runtime behavior.

## Must-Haves

### ✅ 1. Locate redirect intent storage
**Status:** PASS
**Evidence:**
- `JoinGroup.tsx`: `const target = location.pathname + location.search + location.hash;`
- Stores to `splita_redirect_path`.

### ✅ 2. Locate redirect restore logic
**Status:** PASS
**Evidence:**
- `App.tsx`: Reads `splita_redirect_path`.
- Checks `user` presence.
- Compares full URL (`pathname + search + hash`) before navigating.

### ⚠️ 3. Check for overriding navigations
**Status:** WARN
**Evidence:**
- `Login.tsx`: `useEffect` calls `onLogin()` when `user` is present.
- `App.tsx` passes `onLogin={() => navigate(AppRoute.DASHBOARD_PERSONAL)}`.
- **Risk:** Race condition. If `Login` effect fires before `App` redirect logic, user might go to Dashboard.
- **Mitigation:** `App.tsx` logic should ideally run first or `Login` should respect `redirectPath`.
- **Instrumentation Added:** Logs added to trace who "wins" the race.

## Manual Test Script (REQUIRED)

Please perform the following test to verify the fix:

1.  **Open Incognito Window**.
2.  **Go to**: `http://localhost:5173/unirse/INVITE_CODE_HERE` (Use a real code from your DB/Groups).
3.  **Open Console** (F12).
4.  **Click "Unirme"**.
    - Verify Log: `[INVITE] save redirect ...`
5.  **Log in** (Email or Google).
6.  **After Login**:
    - Look for: `[INVITE] user present true path: ...`
    - Look for: `[INVITE] navigating to target`
    - Look for: `[AUTH] Login.tsx effect triggering onLogin`

**Paste the console logs below.**

If `[AUTH]` appears *after* `[INVITE] navigating`, the redirect should work (as `Login` unmounts).
If `[AUTH]` appears *before* or alone, the redirect might be overridden.

## Verdict
**PARTIAL**. Logic is implemented correctly, but a potential race condition exists in `Login.tsx`. Logs will confirm behavior.
