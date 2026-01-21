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
