## Phase 18 Decisions (Group Join)

**Date:** 2026-01-21

### Scope
- **Route**: confirmed as `/unirse/:inviteCode` in `App.tsx`.
- The initial plan assumed `/join`, but the codebase uses `/unirse`.
- **Decision**: Respect existing implementation (`/unirse`). Do NOT change to `/join` unless explicitly requested.

### Approach
- **Frontend**: Keep `JoinGroup.tsx`. Enhance it to use secure RPCs.
- **Backend**: Implement `join_group_by_code` RPC (Security Definer).
- **Consisteny**: Ensure all internal links use `/unirse`.

### Constraints
- No UI changes allowed.
- Must handle auth redirection (already present in `JoinGroup.tsx` but needs verification with new RPC).

---

## Phase 18.4 Decisions (Invite Onboarding & UX Flows)

**Date:** 2026-01-22

### 1. Invite-Based Onboarding
- **Decision:** Option B — Reduced 3-Step Flow
- **Steps:** Welcome (with group context) → Settings → CreateAccount
- **Rationale:** Clean UX, avoids confusion about "Create Group" when user is joining

### 2. Group Join Flow
- **Decision:** Second confirmation modal after signup
- **Flow:** User signs up → arrives at app → sees modal "Join Group X?" → confirms
- **Rationale:** Explicit user consent, avoids auto-joining without awareness

### 3. Permission Errors (Delete Transaction)
- **Decision:** Use modal (PremiumConfirmModal) for error feedback
- **Component:** Reuse `PremiumConfirmModal` with type="info"
- **Message:** "No puedes eliminar este movimiento porque fue cargado por {nombre}."
- **Rationale:** Consistent with existing modal patterns, clearer than toast

### 4. Post-Group Navigation
- **Decision:** Redirect to `/grupos/:id` after group creation
- **Applies to:** Onboarding flow AND dashboard group creation
