# Implementation Plan - Phase 8: AI Premium UX & Import History

Enhance the AI Import experience with premium animations, personality, and persistent history with Supabase Storage.

## User Review Required

> [!IMPORTANT]
> This phase includes permanent storage of receipt images. Users must have a `receipts` bucket configured in Supabase.
> The AI personality will utilize session-level data and historical transaction sums to generate comments.

## Proposed Changes

### 1. Database & Storage
- **Migration**: Create `ai_import_sessions` table.
- **Bucket**: Ensure `receipts` bucket exists in Supabase.

### 2. AI "Insight Engine" (Personality)
- Create a utility to generate Argentine-style comments based on:
    - Current scan totals.
    - Previous month sum (from `personal_transactions` or `transactions`).
    - Comparison: "Gastaste más/menos en X".

### 3. UI/UX: Stardust VFX
- Implement `StardustOverlay` component in `ImportExpenses.tsx`.
- Use Framer Motion/CSS for floating stars/particles.
- implement "Scrolling Text" during processing (the personality insights).

### 4. Persistence Flow
- Update `processFilesWithGemini` to:
    1. Upload images to Supabase Storage.
    2. Save session to `ai_import_sessions`.
    3. Retrieve data from Gemini.

### 5. Navigation
- Add "Historial AI" to `Sidebar.tsx`.
- Create a simple `ImportHistory.tsx` page to list previous sessions.

## Verification Plan

### Manual Verification
1. **Upload**: Trigger import and verify "Stardust" animation.
2. **Personality**: Verify Argentine phrases appear during loading.
3. **Storage**: Check Supabase dashboard to verify images are in the `receipts` bucket.
4. **History**: Navigate to the new History page and see the entry.
