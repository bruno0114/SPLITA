---
phase: 3
plan: 2
wave: 1
---

# Plan 3.2: AI Settings UI

## Objective
Provide a user-friendly interface for managing the Gemini API Key and AI preferences.

## Context
- src/features/settings/pages/Settings.tsx
- src/features/settings/hooks/useProfile.ts

## Tasks

<task type="auto">
  <name>AI Settings Component</name>
  <files>src/features/settings/components/AISettings.tsx</files>
  <action>
    Create a new component with:
    - Input for `Gemini API Key` (password type for safety).
    - Status indicator (Key configured / Missing).
    - Link to Google AI Studio to get a key.
    - "Save" button that calls `updateProfile`.
  </action>
  <verify>Component renders correctly and handles input changes.</verify>
  <done>User can input and trigger a save of their key.</done>
</task>

<task type="auto">
  <name>Settings Integration</name>
  <files>src/features/settings/pages/Settings.tsx</files>
  <action>
    Integrate the `AISettings` component into the main Settings page.
    - Add a new section "Inteligencia Artificial" or "Configuración de IA".
    - Pass the current profile data to it.
  </action>
  <verify>The new section is visible in the Settings page.</verify>
  <done>AI settings are accessible to the user.</done>
</task>

## Success Criteria
- [ ] UI allows entering and saving a Gemini API Key.
- [ ] Key is handled securely (hidden by default in input).
