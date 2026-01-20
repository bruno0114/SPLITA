---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Database & Persistence for AI Keys

## Objective
Enable users to persist their own Gemini API Keys in Supabase and create a centralized service to manage AI calls.

## Context
- .gsd/SPEC.md
- .gsd/ARCHITECTURE.md
- src/lib/supabase.ts
- .gsd/phases/3/RESEARCH.md

## Tasks

<task type="auto">
  <name>Database Migration: AI Keys</name>
  <files>supabase/migrations/20260119_add_gemini_key_to_profiles.sql</files>
  <action>
    Create a migration to add a `gemini_api_key` column to the `profiles` table.
    - Column: `gemini_api_key` (text, nullable).
    - Ensure existing RLS allows the user to update their own profile and read it.
  </action>
  <verify>Apply the migration using Supabase tool or execute the SQL.</verify>
  <done>Column exists in the `profiles` table.</done>
</task>

<task type="auto">
  <name>Centralized AI Service</name>
  <files>src/services/ai.ts</files>
  <action>
    Create a new service to encapsulate Gemini logic.
    - Function `getGeminiClient(userKey?: string)`: returns a configured GoogleGenAI instance.
    - Helper `useAIAccess()`: hook to fetch the user's key from their profile.
    - Implement fallback to `VITE_GEMINI_API_KEY` only if no user key is present.
  </action>
  <verify>Check file content for client initialization logic.</verify>
  <done>Service facilitates calling Gemini with user-provided keys.</done>
</task>

## Success Criteria
- [ ] Users have a field in DB to store their key.
- [ ] Codebase has a single point of entry for Gemini SDK interaction.
