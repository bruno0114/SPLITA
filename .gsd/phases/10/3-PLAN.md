---
phase: 10
plan: 3
wave: 2
---

# Plan 10.3: AI Prompt Evolution & Off-Topic Humor

## Objective
Externalize AI instructions to allow rapid iteration and implement "Off-topic" detection to handle non-financial images with Argentine humor.

## Context
- src/services/ai.ts
- src/lib/ai-prompts.ts
- src/features/expenses/pages/ImportExpenses.tsx

## Tasks

<task type="auto">
  <name>Externalize Prompts & Implement Off-Topic Handler</name>
  <files>
    - src/lib/ai-prompts.ts
    - src/services/ai.ts
  </files>
  <action>
    1. Create `src/lib/ai-prompts.ts` containing the full Gemini system instructions and JSON schemas.
    2. Update `src/services/ai.ts` to import these prompts.
    3. Modify the prompt to include a detection step:
       - If the image is not financial, set `is_financial: false` and generate a `joke` in Argentine slang.
    4. Update the return type of `processFilesWithGemini` to handle this new structure.
  </action>
  <verify>Call AI with a selfie and check if the direct response contains a joke.</verify>
  <done>AI logic is decoupled from instructions and handles off-topic content gracefully.</done>
</task>

<task type="auto">
  <name>UI Feedback for Off-Topic Images</name>
  <files>
    - src/features/expenses/pages/ImportExpenses.tsx
  </files>
  <action>
    1. Update the "Review" step in `ImportExpenses.tsx`:
       - If `is_financial` is false, show a creative "Brainfart" card with the AI's joke and a "Try Again" button.
       - Use a funny AI icon (e.g., a robot with glasses or a confused emoji).
  </action>
  <verify>Upload a photo of a dog and see the funny AI response card.</verify>
  <done>The user gets a high-fidelity humorous feedback for off-topic uploads.</done>
</task>

## Success Criteria
- [ ] Prompts are easily editable in `src/lib/ai-prompts.ts`.
- [ ] Non-financial images trigger a joke response.
- [ ] UI displays the joke in a premium, creative way.
