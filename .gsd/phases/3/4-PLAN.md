---
phase: 3
plan: 4
wave: 1
gap_closure: true
---

# Plan 3.4: Dynamic Model Selection & AI Service Refactor (ADJUSTED)

## Objective
Implement a robust, centralized model selection strategy that prioritizes stability, performs real capability checks, and caches verified models per API key.

## Context
- [ai.ts](file:///Users/brunoaguilar/SPLITA-1/src/services/ai.ts)
- .gsd/phases/3/VERIFICATION.md (Gap 2)

## Tasks

<task type="auto">
  <name>Implement Model Discovery and Smoke Test</name>
  <files>
    <file>/Users/brunoaguilar/SPLITA-1/src/services/ai.ts</file>
  </files>
  <action>
    - Create a centralized selection logic `getEffectiveModel(ai: GoogleGenAI, apiKey: string)`:
      1. Attempt `ai.models.list()` as best-effort.
      2. If listing succeeds, filter for `generateContent` capability.
      3. Define preference order: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash` (standard names). Only use `-exp` if no other candidates match.
      4. Fallback (if listing fails): use ordered list `['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash']`.
    - Implement `smokeTestModel(ai, modelName)`: A minimal `generateContent` call.
    - Implement a simple persistent cache (Map or sessionStorage) to store `apiKey -> verifiedModelName` to avoid repeated listing/smoke testing.
    - Export `clearModelCache()` for use when a key is changed.
  </action>
  <verify>Ensure `ai.ts` compiles and handles `models.list()` failure gracefully.</verify>
  <done>Model selection is centralized and includes a real capability smoke test.</done>
</task>

<task type="auto">
  <name>Refactor Service Functions</name>
  <files>
    <file>/Users/brunoaguilar/SPLITA-1/src/services/ai.ts</file>
  </files>
  <action>
    - Update `validateGeminiKey` to use the discovery logic and smoke test.
    - Update `analyzeFinancialHealth` to use the discovered model.
    - Ensure unified error codes (INVALID_KEY, NO_SUITABLE_MODEL, REJECTED_BY_AI) are returned.
  </action>
  <verify>Check that `ImportExpenses` and `EconomicHealth` correctly pass the key to the refactored functions.</verify>
  <done>Service functions use dynamic selection and return standardized error codes.</done>
</task>

## Success Criteria
- [ ] Stable models are prioritized over experimental ones.
- [ ] `generateContent` capability is verified before caching a model.
- [ ] Fallback list is used if `models.list()` fails.
- [ ] Zero hardcoded "target" models in high-level service functions.
