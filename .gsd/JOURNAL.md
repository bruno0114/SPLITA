# JOURNAL.md

## Session: 2026-01-19
- **Bugfix**: Resolved "flowType is undefined" crash in Auth flow.
- **Phase 1 Completion**: 
  - Centralized onboarding state for data capture.
  - Linked account creation to Supabase group insertion.
  - Wired Social Auth buttons.
- **Decision**: Implemented inline `import` for Supabase inside the hook handler to handle edge cases if the hook is called before full initialization, though standard `useAuth` is the primary path.
