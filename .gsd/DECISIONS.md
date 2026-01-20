# Project Decisions

## Phase 7: AI Import Evolution (FX & Selection)

**Date:** 2026-01-20

### Scope
- **Recurrence / Installments**: 
    - Chosen Approach: **Option B (Practical)**.
    - Implementation: Gemini will detect textual patterns like "Cuota X de Y" or "suscripción". The UI will prompt the user if they want to create a manual reminder/recurrence marker.
    - Out of Scope for now: Automatic future expense generation or background jobs.
- **FX / Currency Handling**: 
    - Implementation: Manual FX handling at import time. If USD is detected, the UI requires a conversion rate input.
    - Data Storage: Store original amount, currency, conversion rate, and converted ARS amount in the database.
- **Item Selection**: 
    - Implementation: Review step will be converted to a selectable list (toggles/checkboxes). Only selected items are saved to Supabase.

### Approach
- **AI Memory**: Gemini remains stateless. Suggestions for recurrence will be based on application-level pattern matching against the database (merchant + frequency), not Gemini's internal memory.
- **FX Suggestion**: The UI may suggest the last used FX value for convenience.

### Constraints
- Keep all existing glassmorphism and animations in the `ImportExpenses` page.
- Do not add presets for USD rates (Blue, Tarjeta, etc.) in this phase.

---

## Phase 10: Deep History & Real-time FX (DolarAPI)

**Date:** 2026-01-20

### AI Prompting & Tone
- **Dynamic Prompts**: The Gemini system prompt will be moved to a configuration file or a constant that is easily accessible (e.g., `src/lib/ai-prompts.ts`) to allow for quick iterations without diving into logic.
- **Off-Topic Detection**: Prompt will be instructed to return a joke if the image is non-financial (selfies, pets, etc.).

### Currency & Dolar API
- **Provider**: `dolarapi.com` will be the primary source for real-time rates.
- **Default Rate**: **Dolar Blue** for general conversions.
- **Secondary Rate**: **Dolar Cripto** will be available as an option in the UI switcher or settings.
- **Animations**: Global currency swaps will trigger a high-quality "Flip & Glow" animation on all price components.

### File Handling
- **Supported Formats**: System must support Images, PDFs, XLS, and DOCX for AI processing.
- **UI Differentiation**: Icons in the history list will reflect the file type (PDF icon, Spreadsheet icon, Word icon, Image preview).
- **Storage**: All files will be persisted in the `receipts` bucket for historical reference.
---

## Phase 11: Expert Categories & UI Refactor

**Date:** 2026-01-20

### Scope
- **Category CRUD**: Implement a full CRUD system for categories stored in a new Supabase `categories` table.
- **AI Auto-creation**: Categories will be created automatically if Gemini detects a new category during bulk import.
- **Category Colors**: Each category will have a persistent color property saved in the database.
- **System vs User Categories**: Users can manage their own categories, while a set of defaults is provided.
- **Category Detail Page**:
    - **Pagination**: Traditional numeric pagination with arrows.
    - **Filtering**: Filter by date range, group/personal scope, and amount.
    - **Actions**: Add movements directly from the category detail page.

### Approach
- **Premium Dropdowns**: Replace all native HTML `<select>` elements with a custom `PremiumDropdown` component that matches the glassmorphic "Mis Finanzas" style.
- **Modular Modals**: Reuse the `TransactionModal` for adding expenses from the category page, pre-linking the selected category.

### Constraints
- **Design Consistency**: All custom components must strictly adhere to the established glassmorphic/premium aesthetic.
- **PWA Feel**: Transitions between category drill-down and main views must be smooth and animated (Framer Motion).
---

## Phase 11.5: Refined Financial UX & Bulk Actions

**Date:** 2026-01-20

### Scope
- **Transaction Card Enhancement**:
    - **Context Badges**: Cards will show if a movement belongs to "Finanzas Personales" or a specific group.
    - **Payment Markers**: Visibility for "Recurrente" (icon) and "Cuotas" (marker like "2/6").
    - **Multi-select**: Creative toggle (checkpoint) on each card to enable bulk selection.
- **Transaction Modal Evolution**:
    - **Premium Selection**: Replace text input for Category with `PremiumDropdown`.
    - **Recurring/Instalments**: Explicit fields to configure these properties during creation or edit.
- **Bulk Actions**:
    - **Floating Toolbar**: Appears when transactions are selected.
    - **Mass Operations**: "Mover Categoría" (batch re-assignment) and "Eliminar" (batch deletion).

### Approach
- **Quick Re-assignment**: Use an instant-access category switcher in the Card's hover menu (Action Option B).
- **Consolidated Components**: Ensure `TransactionCard` is the single source of truth for all transaction lists across the app.

### Constraints
- **Aesthetics**: Selection toggles must be non-intrusive and maintain the "clean" glassmorphic look.
- **Safety**: Bulk deletions MUST require a confirmation prompt showing the count of items to be deleted.
