---
phase: 4
plan: 2
wave: 1
---

# Plan 4.2: AI Keys Lifecycle (P1)

## Objective
Enable users to remove or reset their Gemini API key. This ensures users can clear their config if they want to stop using AI features or if they need to rotate keys without immediate validation blockers.

## Context
- src/features/settings/components/AISettings.tsx
- src/services/ai.ts
- src/features/settings/hooks/useProfile.ts

## Tasks

<task type="auto">
  <name>Implement Clear Key Action</name>
  <files>src/features/settings/components/AISettings.tsx</files>
  <action>
    - Add a "Eliminar Llave" (Remove Key) button next to the Validate/Save button.
    - Implement `handleDelete` which calls `onSave("")` (setting key to empty string).
    - Add a simple confirmation state to avoid accidental deletion.
    - Clear local state and show a success message ("Llave eliminada").
  </action>
  <verify>Visual verification of the new button and functional test of clearing the input.</verify>
  <done>Clicking 'Eliminar' removes the key from UI and triggers the save callback with an empty string.</done>
</task>

<task type="auto">
  <name>Cache Invalidation</name>
  <files>src/services/ai.ts</files>
  <action>
    Ensure `clearModelCache(apiKey)` is effectively used when a key is removed to prevent stale model selection logic from persisting for that user session.
  </action>
  <verify>Review ai.ts to ensure clearModelCache exported correctly.</verify>
  <done>Model cache is cleared upon key removal or update.</done>
</task>

## Success Criteria
- [ ] Users can successfully clear their Gemini API key from Settings.
- [ ] UI reflects "Sin configurar" status immediately after removal.
- [ ] Subsequent AI calls correctly detect missing key and prompt for configuration.
