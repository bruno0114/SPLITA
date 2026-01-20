---
phase: 10
plan: 2
wave: 1
---

# Plan 10.2: Pro-Level AI History (Modals & File Types)

## Objective
Enhance the AI history list with deep interactive details, support for multiple document types (PDF, XLSX, DOCX), and the ability to manually refine session data.

## Context
- src/features/expenses/pages/AIHistory.tsx
- src/features/expenses/hooks/useAIHistory.ts
- src/types/index.ts

## Tasks

<task type="auto">
  <name>Implement History Detail Modal & File Logic</name>
  <files>
    - src/features/expenses/components/HistoryDetailModal.tsx
    - src/features/expenses/pages/AIHistory.tsx
  </files>
  <action>
    1. Create `HistoryDetailModal.tsx`:
       - Show the original file (Image preview or icon for PDF/XLS).
       - List all extracted transactions with their details.
       - Add a "Manual Entry" form within the modal to add missed expenses to the session.
    2. Update `AIHistory.tsx`:
       - Implement logic to detect file type from URL extension.
       - Use appropriate icons: `FileText` (PDF), `FileSpreadsheet` (XLS), `FileWord` (DOCX).
       - Trigger the detail modal on card click.
  </action>
  <verify>Click on a history item and see the detailed modal with correct file icons.</verify>
  <done>History is fully interactive and supports non-image document types.</done>
</task>

<task type="auto">
  <name>Enhance History Hook for Manual Refinement</name>
  <files>
    - src/features/expenses/hooks/useAIHistory.ts
  </files>
  <action>
    1. Add `updateSessionData(sessionId, newData)` to the hook.
    2. This allow the UI to save changes (like manually added expenses) back to the `ai_import_sessions` table.
  </action>
  <verify>Edit a session in the modal, refresh, and see changes persist.</verify>
  <done>Session data can be manually refined and persisted.</done>
</task>

## Success Criteria
- [ ] Modals display side-by-side view of file and data.
- [ ] Users can add missing items to a previous history session.
- [ ] PDF/XLS/DOCX files show distinct, premium icons.
